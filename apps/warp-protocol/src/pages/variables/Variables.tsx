import styles from './Variables.module.sass';
import { Container, UIElementProps } from '@terra-money/apps/components';
import { Button, Text } from 'components/primitives';
import { Variable, useVariableStorage } from './useVariableStorage';
import { useState } from 'react';
import { IfConnected } from 'components/if-connected';
import { NotConnected } from 'components/not-connected';
import { Nav } from './nav/Nav';
import { Details } from './details';
import { useNewVariableDialog } from './dialogs/VariableDialog';
import { variableName } from 'utils/variable';

type VariablesContentProps = {};

const VariablesContent = (props: VariablesContentProps) => {
  const { variables, saveVariable, removeVariable } = useVariableStorage();
  const [selectedVariable, setSelectedVariable] = useState<Variable | undefined>(undefined);

  const openNewVariableDialog = useNewVariableDialog();

  return (
    <Container direction="column" className={styles.content}>
      <Container className={styles.header}>
        <Text variant="heading1" className={styles.title}>
          Variables
        </Text>
        <Button
          variant="primary"
          onClick={async () => {
            const variable = await openNewVariableDialog({});

            if (variable) {
              saveVariable(variable, selectedVariable);
            }
          }}
        >
          New Variable
        </Button>
      </Container>
      <Container className={styles.bottom} direction="row">
        <Nav
          className={styles.nav}
          selectedVariable={selectedVariable}
          variables={variables}
          deleteVariable={(v) => removeVariable(variableName(v))}
          saveVariable={(variable) => {
            saveVariable(variable, selectedVariable);
            setSelectedVariable(variable);
          }}
          onVariableClick={(v) => setSelectedVariable(v)}
        />
        <Details
          className={styles.details}
          selectedVariable={selectedVariable}
          saveVariable={(variable) => {
            saveVariable(variable, selectedVariable);
            setSelectedVariable(variable);
          }}
          deleteVariable={(variable) => {
            removeVariable(variable);
            setSelectedVariable(undefined);
          }}
        />
      </Container>
    </Container>
  );
};

export const Variables = (props: UIElementProps) => {
  return (
    <IfConnected
      then={
        <Container direction="column" className={styles.root}>
          <VariablesContent />
        </Container>
      }
      else={<NotConnected />}
    />
  );
};
