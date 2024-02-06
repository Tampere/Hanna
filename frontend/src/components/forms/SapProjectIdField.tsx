import { TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { TextFieldWithStatus } from './TextFieldWithStatus';

export const SapProjectIdField = forwardRef(function SapProjectIdField(
  props: TextFieldProps & { value: string },
  ref: React.ForwardedRef<HTMLDivElement | null>,
) {
  const { sap } = trpc.useContext();
  const tr = useTranslations();

  return (
    <TextFieldWithStatus
      ref={ref}
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
});
