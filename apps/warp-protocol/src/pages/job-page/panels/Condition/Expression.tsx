import { UIElementProps } from '@terra-money/apps/components';
import { warp_controller } from '../../../../types';
import { BlockHeightExpression } from './typed-expressions/BlockHeightExpression';
import { StringExpression } from './typed-expressions/StringExpression';
import { TimestampExpression } from './typed-expressions/TimestampExpression';
import { BoolExpression } from './typed-expressions/BoolExpression';
import { DecimalExpression } from './typed-expressions/DecimalExpression';
import { IntExpression } from './typed-expressions/IntExpression';
import { UIntExpression } from './typed-expressions/UIntExpression';
import { Job } from 'types/job';

export type ExpressionProps = {
  expression: warp_controller.Expr;
  job: Job;
} & UIElementProps;

export const Expression = (props: ExpressionProps) => {
  const { expression, className, job } = props;

  if ('string' in expression) {
    return <StringExpression className={className} expression={expression.string} job={job} />;
  }

  if ('block_height' in expression) {
    return <BlockHeightExpression className={className} expression={expression.block_height} job={job} />;
  }

  if ('timestamp' in expression) {
    return <TimestampExpression className={className} expression={expression.timestamp} job={job} />;
  }

  if ('bool' in expression) {
    return <BoolExpression className={className} variableRef={expression.bool} job={job} />;
  }

  if ('decimal' in expression) {
    return <DecimalExpression className={className} expression={expression.decimal} job={job} />;
  }

  if ('int' in expression) {
    return <IntExpression className={className} expression={expression.int} job={job} />;
  }

  if ('uint' in expression) {
    return <UIntExpression className={className} expression={expression.uint} job={job} />;
  }

  return <span className={className}>unknown expression</span>;
};
