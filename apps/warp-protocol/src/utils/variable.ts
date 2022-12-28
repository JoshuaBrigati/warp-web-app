import { warp_controller } from 'types';

export const resolveVariableRef = (ref: string, vars: warp_controller.Variable[]) => {
  const name = extractName(ref);
  const v = vars.find((v) => variableName(v) === name);
  return v as warp_controller.Variable;
};

export const variableName = (v: warp_controller.Variable): string => {
  if ('static' in v) {
    return v.static.name;
  }

  if ('external' in v) {
    return v.external.name;
  }

  return v.query.name;
};

export const variableValue = (v: warp_controller.Variable) => {
  if ('static' in v) {
    return v.static.value;
  }

  if ('external' in v) {
    return v.external.value;
  }

  return v.query.value;
};

export const variableKind = (v: warp_controller.Variable): warp_controller.VariableKind => {
  if ('static' in v) {
    return v.static.kind;
  }

  if ('external' in v) {
    return v.external.kind;
  }

  return v.query.kind;
};

const extractName = (str: string) => {
  const parts = str.split('.');
  return parts[parts.length - 1];
};