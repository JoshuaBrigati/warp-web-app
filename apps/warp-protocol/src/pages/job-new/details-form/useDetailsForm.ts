import {
  FormFunction,
  FormInitializer,
  FormModifier,
  FormState,
  LocalWallet,
  useForm,
  useLocalWallet,
} from '@terra-money/apps/hooks';
import { fetchTokenBalance } from '@terra-money/apps/queries';
import { Token, u } from '@terra-money/apps/types';
import Big from 'big.js';
import { useMemo } from 'react';
import { isEmpty } from 'lodash';
import { templateVariables } from 'utils/variable';
import { useNativeToken } from 'hooks/useNativeToken';
import { Template } from 'types';
import { microfy } from '@terra-money/apps/libs/formatting';

export interface DetailsFormInput {
  name: string;
  description: string;
  durationDays: string;
  message: string;
  recurring: boolean;
  fundingAccount?: string;
  template?: Template;
  token?: Token;
  amount?: string;
  selectedTabType?: 'template' | 'message';
}

interface DetailsFormState extends FormState<DetailsFormInput> {
  submitDisabled: boolean;
  tokenBalance: u<Big>;
  tokenBalanceLoading: boolean;
  nativeBalance: u<Big>;
  nativeBalanceLoading: boolean;
}

const dispatchBalance = async (
  dispatch: FormModifier<DetailsFormState>,
  localWallet: LocalWallet,
  token: Token,
  prefix: string
) => {
  dispatch({
    [`${prefix}Balance`]: Big(0) as u<Big>,
    [`${prefix}BalanceLoading`]: true,
  });

  try {
    const balance = await fetchTokenBalance(localWallet.lcd, token, localWallet.walletAddress);

    dispatch({
      [`${prefix}Balance`]: balance as u<Big>,
      [`${prefix}BalanceLoading`]: false,
    });
  } catch {
    dispatch({
      [`${prefix}Balance`]: Big(0) as u<Big>,
      [`${prefix}BalanceLoading`]: true,
    });
  }
};

export const useDetailsForm = (input?: DetailsFormInput) => {
  const initialValue = useMemo<DetailsFormState>(
    () => ({
      name: input?.name ?? '',
      durationDays: input?.durationDays ?? '',
      message: input?.message ?? '',
      description: input?.description ?? '',
      template: input?.template ?? undefined,
      selectedTabType: input?.selectedTabType ?? 'message',
      submitDisabled: input ? false : true,
      tokenBalance: Big(0) as u<Big>,
      tokenBalanceLoading: false,
      nativeBalance: Big(0) as u<Big>,
      nativeBalanceLoading: false,
      recurring: input?.recurring ?? false,
      token: input?.token ?? undefined,
      amount: input?.amount ?? undefined,
    }),
    [input]
  );

  const wallet = useLocalWallet();
  const nativeToken = useNativeToken();

  const initializer: FormInitializer<DetailsFormState> = async (_, dispatch) => {
    if (wallet.connectedWallet === undefined) {
      throw Error('The wallet is not connected');
    }

    dispatchBalance(dispatch, wallet, nativeToken, 'native');
  };

  const form: FormFunction<DetailsFormInput, DetailsFormState> = async (input, getState, dispatch) => {
    const state = {
      ...getState(),
      ...input,
    };

    if ('token' in input && input.token) {
      dispatchBalance(dispatch, wallet, input.token, 'token');
    }

    let messageError = undefined;

    if (state.message) {
      try {
        JSON.parse(state.message);
      } catch (err) {
        messageError = 'Message format invalid.';
      }
    }

    const uAmount = state.token && state.amount ? microfy(state.amount, state.token.decimals) : Big(0);

    const amountError = uAmount.gt(state.tokenBalance) ? 'The amount can not exceed the maximum balance' : undefined;

    const amountValid = uAmount.gt(0) && amountError === undefined;

    const nameError = state.name.length > 140 ? 'The name can not exceed the maximum of 140 characters' : undefined;

    const descriptionError =
      state.description.length > 200 ? 'The description can not exceed the maximum of 200 characters' : undefined;

    const messageValid = Boolean(state.message) && messageError === undefined;

    const templateError = Boolean(state.template && templateVariables(state.template).find((v) => isEmpty(v.value)))
      ? 'All variables must be filled.'
      : undefined;

    const submitDisabled =
      Boolean(state.token && !amountValid) ||
      Boolean(
        state.name === undefined ||
          state.name === null ||
          state.name.length < 1 ||
          state.durationDays === undefined ||
          state.durationDays === null ||
          state.durationDays.length < 1 ||
          nameError ||
          descriptionError ||
          state.message === undefined ||
          messageError ||
          !messageValid ||
          templateError
      );

    dispatch({
      ...state,
      nameError,
      messageValid,
      messageError,
      amountError,
      amountValid,
      descriptionError,
      templateError,
      submitDisabled,
    });
  };

  return useForm<DetailsFormInput, DetailsFormState>(form, initialValue, initializer);
};
