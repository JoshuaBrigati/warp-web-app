import { LocalWallet, useLocalWallet } from '@terra-money/apps/hooks';
import { useCallback, useMemo } from 'react';
import { warp_controller } from 'types/contracts/warp_controller';
import { useLocalStorage } from 'usehooks-ts';
import { variableName } from 'utils/variable';

type VariablesStorage = {
  [key: string]: warp_controller.Variable[];
};

const storageKey = (localWallet: LocalWallet) => `${localWallet.chainId}--${localWallet.walletAddress}`;

export const useVariableStorage = () => {
  const localWallet = useLocalWallet();

  const initialValue = useMemo(() => {
    return {};
  }, []);

  const [storedVariables, setStoredVariables] = useLocalStorage<VariablesStorage>(
    '__warp_stored_variables',
    initialValue
  );

  const setVariables = useCallback(
    (variables: warp_controller.Variable[]) => {
      if (!localWallet.connectedWallet) {
        return;
      }

      setStoredVariables((storedVariables) => {
        return {
          ...storedVariables,
          [storageKey(localWallet)]: variables,
        };
      });
    },
    [localWallet, setStoredVariables]
  );

  const variables = useMemo(() => {
    if (!localWallet.connectedWallet) {
      return [];
    }

    return storedVariables[storageKey(localWallet)] ?? [];
  }, [storedVariables, localWallet]);

  const saveAll = useCallback(
    (variables: warp_controller.Variable[]) => {
      setVariables(variables);
    },
    [setVariables]
  );

  const updateVariable = useCallback(
    (variable: warp_controller.Variable, prev: warp_controller.Variable) => {
      const variableExists = Boolean(variables.find((v) => variableName(v) === variableName(prev)));
      let updatedVariables: warp_controller.Variable[] = [...variables];

      if (variableExists) {
        const newVariables = [...variables];
        newVariables[variables.findIndex((v) => variableName(v) === variableName(prev))] = variable;
        updatedVariables = newVariables;
      }

      setVariables(updatedVariables);
    },
    [setVariables, variables]
  );

  const saveVariable = useCallback(
    (variable: warp_controller.Variable) => {
      const variableExists = Boolean(variables.find((v) => variableName(v) === variableName(variable)));
      let updatedVariables: warp_controller.Variable[] = [...variables];

      if (!variableExists) {
        updatedVariables = [...variables, variable];
      }

      setVariables(updatedVariables);
    },
    [setVariables, variables]
  );

  const removeVariable = useCallback(
    (name: string) => {
      return setVariables(variables.filter((v) => variableName(v) !== name));
    },
    [setVariables, variables]
  );

  return useMemo(
    () => ({
      variables,
      saveVariable,
      removeVariable,
      updateVariable,
      saveAll,
    }),
    [variables, saveVariable, removeVariable, saveAll, updateVariable]
  );
};
