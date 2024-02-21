import { warp_resolver } from '@terra-money/warp-sdk';
import { operatorLabel } from '../operatorLabel';
import { UIElementProps } from '@terra-money/apps/components';
import { Job } from 'types/job';
import { ExpressionValue } from './ExpressionValue';

export type StringExpressionProps = {
  expression: warp_resolver.GenExprFor_StringValueFor_StringAnd_StringOp;
  job: Job;
} & UIElementProps;

export const StringExpression = (props: StringExpressionProps) => {
  const { expression, className, job } = props;
  const operator = operatorLabel(expression.op);

  const left = <ExpressionValue job={job} value={expression.left} />;
  const right = <ExpressionValue job={job} value={expression.right} />;

  return (
    <span className={className}>
      String: {left} {operator} {right}
    </span>
  );
};
