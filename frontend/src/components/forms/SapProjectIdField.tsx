import { TextFieldProps } from '@mui/material';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { TextFieldWithStatus } from './TextFieldWithStatus';

export function SapProjectIdField(props: TextFieldProps & { value: string }) {
  const { sap } = trpc.useContext();
  const tr = useTranslations();

  return (
    <TextFieldWithStatus
      {...props}
      validate={async (value) => {
        return await sap.doesSapProjectIdExist.fetch({ projectId: value });
      }}
      messages={{
        error: tr('sapProjectIdField.unexpectedError'),
        loading: tr('sapProjectIdField.loading'),
        invalid: tr('sapProjectIdField.invalidId'),
        valid: tr('sapProjectIdField.validId'),
      }}
    />
  );
}
