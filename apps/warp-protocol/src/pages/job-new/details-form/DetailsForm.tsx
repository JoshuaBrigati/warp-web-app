import { InputAdornment } from '@mui/material';
import { Container, UIElementProps } from '@terra-money/apps/components';
import classNames from 'classnames';
import { FormControl } from 'components/form-control/FormControl';
import { Form } from 'components/form/Form';
import { Button, Link, Text } from 'components/primitives';
import { TextInput } from 'components/primitives/text-input';
import { useNavigate } from 'react-router';
import { warp_resolver } from '@terra-money/warp-sdk';
import { Footer } from '../footer/Footer';
import styles from './DetailsForm.module.sass';
import { DetailsFormInput, useDetailsForm } from './useDetailsForm';
import { useTemplatesQuery } from 'queries/useTemplatesQuery';
import { TemplateForm } from './template-form/TemplateForm';
import { MsgInput } from 'forms/QueryExprForm/MsgInput';
import { variableName } from 'utils/variable';
import { useCachedVariables } from '../useCachedVariables';
import { useCallback, useEffect } from 'react';
import { useJobStorage } from '../useJobStorage';
import { ToggleInput } from 'pages/dashboard/jobs-widget/inputs/ToggleInput';
import { NumericInput } from 'components/primitives/numeric-input';

type DetailsFormProps = UIElementProps & {
  onNext: (props: DetailsFormInput & { variables: warp_resolver.Variable[] }) => void;
  detailsInput?: DetailsFormInput;
  loading?: boolean;
  mode: string;
};

type TabType = 'template' | 'message';

const tabTypes = ['template', 'message'] as TabType[];

export const DetailsForm = (props: DetailsFormProps) => {
  const { onNext, className, detailsInput, mode, loading } = props;

  const [
    input,
    {
      name,
      nameError,
      durationDays,
      message,
      selectedTabType,
      template,
      description,
      descriptionError,
      messageError,
      submitDisabled,
      recurring,
    },
  ] = useDetailsForm(detailsInput);

  const navigate = useNavigate();

  const { data: options = [] } = useTemplatesQuery();

  const { variables, updateVariable } = useCachedVariables();

  const { setCond } = useJobStorage();

  useEffect(() => {
    if (template?.condition) {
      setCond(template.condition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const onDocsClick = useCallback(() => {
    window.open('https://docs.warp.money');
  }, []);

  return (
    <Container direction="column" className={classNames(styles.root, className)}>
      <Container className={styles.title_container}>
        <Text variant="heading1" className={styles.title}>
          New job
        </Text>
        <Link className={styles.back} to={-1}>
          Back
        </Link>
        <Text className={styles.description} variant="label">
          Below you may enter job information including the Cosmos message payload, along with the reward provided to
          the keeper for successfully executing the job. Any tokens sent as part of the job's message must be present in
          your Warp account balance at the moment of execution.
        </Text>
      </Container>
      <Form className={styles.form}>
        <FormControl label="Name" className={styles.name_input}>
          <TextInput
            placeholder="Type name here"
            margin="none"
            value={name}
            onChange={(value) => {
              input({ name: value.target.value });
            }}
            helperText={nameError}
            error={nameError !== undefined}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {name && name.length > 0 && <Text variant="label">{`${name?.length ?? 0}/140`}</Text>}
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
        <FormControl className={styles.amount_input} label="Duration (in days)">
          <NumericInput
            placeholder="Type number of days"
            value={durationDays}
            onChange={(value) =>
              input({
                durationDays: value.target.value,
              })
            }
          />
        </FormControl>
        <FormControl label="Description" className={styles.description_input}>
          <TextInput
            placeholder="Type a comprehensive description of the job. Your precise details will help us tailor AI assistance."
            margin="none"
            className={styles.description_inner}
            multiline={true}
            value={description}
            onChange={(value) => {
              input({ description: value.target.value });
            }}
            helperText={descriptionError}
            error={descriptionError !== undefined}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {description && description.length > 0 && (
                    <Text className={styles.textarea_label} variant="label">{`${description?.length ?? 0}/200`}</Text>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        <ToggleInput
          className={styles.recurring}
          label="Job is recurring"
          helpText="This determines whether a job is rescheduled after being executed."
          value={recurring}
          onChange={(value) => input({ recurring: value })}
        />

        <Container className={styles.tabs} direction="row">
          {tabTypes.map((tabType) => (
            <Button
              key={tabType}
              className={classNames(styles.tab, tabType === selectedTabType && styles.selected_tab)}
              onClick={() => input({ selectedTabType: tabType })}
              variant="secondary"
            >
              {tabType}
            </Button>
          ))}
        </Container>
        {selectedTabType === 'template' && (
          <>
            <TemplateForm
              options={options}
              template={template}
              setTemplate={(template) => input({ template })}
              setTemplateVars={(updatedVars) =>
                input({
                  template: {
                    ...template!,
                    vars: template!.vars.map((v) => {
                      const updated = updatedVars.find((t) => t.name === variableName(v));

                      if (updated) {
                        const res = { static: updated };
                        updateVariable(res, v);
                        return res;
                      }

                      return v;
                    }),
                  },
                })
              }
              onMessageComposed={(message) => input({ message })}
            />
          </>
        )}
        {selectedTabType === 'message' && (
          <>
            <MsgInput
              rootClassName={styles.msg_input}
              label="Message"
              className={styles.msg_input_inner}
              error={messageError}
              valid
              placeholder="Type your message here"
              value={message}
              onChange={(value) => input({ message: value })}
            />
          </>
        )}
      </Form>
      <Footer>
        <Button
          variant="primary"
          disabled={submitDisabled}
          loading={loading}
          onClick={async () => {
            if (name && durationDays && message) {
              onNext({ name, durationDays, message, template, selectedTabType, variables, description, recurring });
            }
          }}
        >
          {mode === 'basic' && template?.condition ? 'Save' : 'Next'}
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Text className={styles.eviction_warning} variant="label">
          Jobs not executed within the eviction period will have a minimal fee deducted from it's reward and returned to
          queue.
          <Link className={styles.link} onClick={onDocsClick}>
            Docs
          </Link>
        </Text>
      </Footer>
    </Container>
  );
};
