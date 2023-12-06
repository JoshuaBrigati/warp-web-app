import { EventIndexer, IndexFnOptions } from 'indexers/EventIndexer';
import { TableNames, ANALYTICS_PK_NAME, ANALYTICS_SK_NAME } from 'initializers';
import { Entity } from './types';
import { KeySelector } from '@apps-shared/indexers/services/persistence';
import { WarpPK, WarpControllerActions, ExecuteJobEvent, CreateJobEvent, ExecuteReplyEvent } from 'types/events';
import { eventAggregator, eventCounter } from '@apps-shared/indexers/indexers/utils';
import Big from 'big.js';
import { createDynamoDBClient, fetchAll } from '@apps-shared/indexers/utils';
import { group } from 'd3-array';
import { Timestamp } from '@apps-shared/indexers/types';
import { addDays, addMonths } from 'date-fns';

export const PK: KeySelector<Entity> = (data) => data.type;

export const SK: KeySelector<Entity> = (data) => data.timestamp;

const makePK = (...parts: string[]) => {
  return `warp:${parts.join(':')}`;
};

export class Indexer extends EventIndexer<Entity> {
  chainName: string;

  constructor(chainName: string) {
    super({
      name: 'analytics',
      tableName: TableNames.analytics(chainName),
      pk: PK,
      sk: SK,
      pkName: ANALYTICS_PK_NAME,
      chainName,
      skName: ANALYTICS_SK_NAME,
    });

    this.chainName = chainName;
  }

  private save = async (type: string, counts: Array<Pick<Entity, 'timestamp' | 'value'>>) => {
    const entities = counts.map((count) => {
      return {
        ...count,
        type,
      };
    });

    entities.forEach((entity) => {
      this.logger.info(`timestamp=${entity.timestamp} type=${entity.type} total=${entity.value}`);
    });

    await this.persistence.save(entities);
  };

  private cascade = async (fromPK: string, toPK: string, timestamps: number[][]) => {
    const dynamoDBClient = createDynamoDBClient();

    const output = [];

    for (let timestamp of timestamps) {
      const entities = await fetchAll<Entity>(dynamoDBClient, {
        TableName: TableNames.analytics(this.chainName),
        KeyConditions: {
          [ANALYTICS_PK_NAME]: {
            AttributeValueList: [{ S: fromPK }],
            ComparisonOperator: 'EQ',
          },
          [ANALYTICS_SK_NAME]: {
            AttributeValueList: [{ N: timestamp[0].toString() }, { N: timestamp[1].toString() }],
            ComparisonOperator: 'BETWEEN',
          },
        },
      });

      output.push({
        type: toPK,
        timestamp: timestamp[0],
        value: entities.reduce((previous, current) => previous.add(current.value), new Big(0)).toString(),
      });
    }

    await this.persistence.save(output);
  };

  private cascadeDaily = (fromPK: string, toPK: string, timestamps: number[]) => {
    const groups = group(timestamps, (k) => new Timestamp(k).truncate('day').toNumber());

    const timestampRanges = Array.from(groups).map((t) => {
      const from = t[0];

      const to = Timestamp.from(addDays(from * 1000, 1)).toNumber() - 1;

      return [from, to];
    });

    return this.cascade(fromPK, toPK, timestampRanges);
  };

  private cascadeMonthly = (fromPK: string, toPK: string, timestamps: number[]) => {
    const groups = group(timestamps, (k) => new Timestamp(k).truncate('month').toNumber());

    const timestampRanges = Array.from(groups).map((t) => {
      const from = t[0];

      const to = Timestamp.from(addMonths(from * 1000, 1)).toNumber() - 1;

      return [from, to];
    });

    return this.cascade(fromPK, toPK, timestampRanges);
  };

  private handleCreateJobEvents = async (minHeight: number, maxHeight: number) => {
    // Count create_job events
    const createJobAggregates = await eventCounter<CreateJobEvent>(
      this.events,
      WarpPK.controller('create_job'),
      minHeight,
      maxHeight
    );

    // Count execute_reply events with specific recur_job sub_action
    const executeReplyAggregates = await eventAggregator<ExecuteReplyEvent>(
      this.events,
      WarpPK.controller('execute_reply'),
      minHeight,
      maxHeight,
      (events) => events.filter((event) => event.payload.sub_action === 'recur_job').length
    );

    // Combine the counts
    const combinedAggregates = createJobAggregates.map((aggregate, index) => ({
      timestamp: aggregate.timestamp,
      value: (parseInt(aggregate.value) + parseInt(executeReplyAggregates[index]?.value || '0')).toString(),
    }));

    // Save combined counts
    const key = 'create_job_count';
    await this.save(makePK(key, 'hourly'), combinedAggregates);
    await this.cascadeDaily(
      makePK(key, 'hourly'),
      makePK(key, 'daily'),
      combinedAggregates.map((t) => t.timestamp)
    );
    await this.cascadeMonthly(
      makePK(key, 'daily'),
      makePK(key, 'monthly'),
      combinedAggregates.map((t) => t.timestamp)
    );
  };

  private updateEventCounts = async (minHeight: number, maxHeight: number) => {
    const events: WarpControllerActions[] = [
      'execute_job',
      'update_job',
      'execute_job',
      'prioritize_job',
    ];

    // Handle create_job (and relevant execute_reply) separately
    await this.handleCreateJobEvents(minHeight, maxHeight);

    // aggregate the event counts
    for (let event of events) {
      const aggregates = await eventCounter(this.events, WarpPK.controller(event), minHeight, maxHeight);

      const key = `${event}_count`;

      await this.save(makePK(key, 'hourly'), aggregates);

      await this.cascadeDaily(
        makePK(key, 'hourly'),
        makePK(key, 'daily'),
        aggregates.map((t) => t.timestamp)
      );

      await this.cascadeMonthly(
        makePK(key, 'daily'),
        makePK(key, 'monthly'),
        aggregates.map((t) => t.timestamp)
      );
    }
  };

  private updateRewardAmount = async (minHeight: number, maxHeight: number) => {
    const aggregates = await eventAggregator<ExecuteJobEvent, string>(
      this.events,
      WarpPK.controller('execute_job'),
      minHeight,
      maxHeight,
      (events) =>
        events.reduce((previous, current) => {
          return Big(previous)
            .add(current.payload.job_reward ?? '0')
            .toString();
        }, '0')
    );

    const key = 'reward_amount';

    await this.persistence.save(
      aggregates.map((aggregate) => {
        return {
          type: makePK(key, 'hourly'),
          ...aggregate,
        };
      })
    );

    await this.cascadeDaily(
      makePK(key, 'hourly'),
      makePK(key, 'daily'),
      aggregates.map((t) => t.timestamp)
    );

    await this.cascadeMonthly(
      makePK(key, 'daily'),
      makePK(key, 'monthly'),
      aggregates.map((t) => t.timestamp)
    );
  };

  override index = async (options: IndexFnOptions): Promise<void> => {
    const { current, genesis } = options;

    let { height } = await this.state.get({ height: genesis.height });

    await this.updateEventCounts(height, current.height);

    await this.updateRewardAmount(height, current.height);

    await this.state.set({ height: current.height });
  };
}
