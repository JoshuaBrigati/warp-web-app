import { warp_resolver, extractVariableName } from '@terra-money/warp-sdk';
import { Template } from 'types';

export const resolveVariableRef = (ref: string, vars: warp_resolver.Variable[]) => {
  const name = extractVariableName(ref);
  const v = vars.find((v) => variableName(v) === name);
  return v as warp_resolver.Variable;
};

export const isVariableRef = (value: string) => value.startsWith('$warp.variable.');

export const variableRef = (variable: warp_resolver.Variable) => {
  return `$warp.variable.${variableName(variable)}`;
};

export const variableName = (v: warp_resolver.Variable): string => {
  if (!v) {
    return 'unknown';
  }

  if ('static' in v) {
    return v.static.name;
  }

  if ('external' in v) {
    return v.external.name;
  }

  return v.query.name;
};

export const variableValue = (v: warp_resolver.Variable) => {
  if ('static' in v) {
    return v.static.value;
  }

  if ('external' in v) {
    return v.external.value;
  }

  return v.query.value;
};

export const variableKind = (v: warp_resolver.Variable): warp_resolver.VariableKind => {
  if ('static' in v) {
    return v.static.kind;
  }

  if ('external' in v) {
    return v.external.kind;
  }

  return v.query.kind;
};

export const templateVariables = (template: Template) => {
  const staticVariables = template.vars.filter((v) => 'static' in v) as Extract<
    warp_resolver.Variable,
    { static: {} }
  >[];

  return staticVariables.map((v) => v.static);
};

export const findVariablePath = (json: any, name: string): string | undefined => {
  const path: string[] = [];

  const search = (obj: any, currentPath: string): boolean => {
    if (obj instanceof Object) {
      for (const [key, value] of Object.entries(obj)) {
        if (search(value, `${currentPath}.${key}`)) {
          return true;
        }
      }
      return false;
    }
    if (obj === `$warp.variable.${name}`) {
      path.push(currentPath);
      return true;
    }
    return false;
  };

  search(json, '$');

  return path.length > 0 ? path[0] : undefined;
};

export const formattedStringVarNames = (formattedString: string) => {
  return formattedString.match(/\{[^}]+\}/g)?.map((s) => s.slice(1, -1)) || [];
};

export const formattedStringVariables = (formattedString: string, variables: warp_resolver.Variable[]) => {
  const variableNames = formattedStringVarNames(formattedString);

  return variableNames.map((name) => variables.find((v) => variableName(v) === name)) as warp_resolver.Variable[];
};

export function hasOnlyStaticVariables(formattedString: string, variables: warp_resolver.Variable[]): boolean {
  // Extract all the variable names from the formatted string
  const variableNames = formattedStringVarNames(formattedString);

  // Check if all the variable names are defined in the list of variables
  return variableNames.every((name) => variables.some((v) => 'static' in v && v.static.name === name));
}
