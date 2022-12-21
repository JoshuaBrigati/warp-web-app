import { FormFunction, FormInput, FormState, useForm } from '@terra-money/apps/hooks';
import { useMemo } from 'react';
import { isEmpty } from 'lodash';
import { warp_controller } from 'types';

interface TemplateNewInput {
  name: string;
  kind: warp_controller.TemplateKind;
  vars: warp_controller.TemplateVar[];
  formattedStr: string;
  msg: string;
}

export interface TemplateNewState extends TemplateNewInput, FormState<TemplateNewInput> {
  submitDisabled: boolean;
}

export type TemplateNewFormInput = FormInput<TemplateNewInput>;

export const templateToInput = (template?: warp_controller.Template): TemplateNewInput => {
  return {
    name: template?.name ?? '',
    kind: template?.kind ?? ('' as any),
    vars: template?.vars ?? [],
    formattedStr: template?.formatted_str ?? '',
    msg: template?.msg ?? '',
  };
};

export const useTemplateNewForm = (template?: warp_controller.Template) => {
  const initialValue = useMemo<TemplateNewState>(() => {
    const res = {
      ...templateToInput(template),
      submitDisabled: true,
    };

    return res;
  }, [template]);

  const form: FormFunction<TemplateNewInput, TemplateNewState> = async (input, getState, dispatch) => {
    const state = {
      ...getState(),
      ...input,
    };

    let msgError = undefined;

    if (state.msg) {
      try {
        JSON.parse(state.msg);
      } catch (err) {
        msgError = 'Message format invalid.';
      }
    }

    const nameError = state.name.length > 140 ? 'The name can not exceed the maximum of 140 characters' : undefined;

    const varsError = Boolean(state.vars.find((v) => isEmpty(v.kind) || isEmpty(v.name) || isEmpty(v.path)))
      ? 'All variables must be filled.'
      : undefined;

    const kindError = isEmpty(state.kind) ? 'Template type must be assigned.' : undefined;

    const formattedStrError = isEmpty(state.msg) ? 'Template must must be set' : undefined;

    const submitDisabled = Boolean(
      state.name === undefined ||
        state.name === null ||
        state.name.length < 1 ||
        nameError ||
        state.msg === undefined ||
        state.msgError ||
        varsError ||
        kindError ||
        formattedStrError
    );

    dispatch({
      ...state,
      nameError,
      msgError,
      submitDisabled,
      varsError,
      kindError,
      formattedStrError,
    });
  };

  return useForm<TemplateNewInput, TemplateNewState>(form, initialValue);
};