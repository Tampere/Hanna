import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { type CodeId } from '@shared/schema/code';

import { CodeSelect } from './CodeSelect';
import { CodeSelectWithStatus } from './CodeSelectWithStatus';

type Props = {
  id?: string;
  name: string;
  value?: CodeId['id'];
  onChange: (newValue: CodeId['id'] | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  sapWbsId?: string | null;
};

export function EnvironmentalCodeSelect({ sapWbsId, ...props }: Props) {
  const { sap } = trpc.useUtils();
  const tr = useTranslations();

  return sapWbsId ? (
    <CodeSelectWithStatus
      {...props}
      showIdInLabel
      multiple={false}
      codeListId="YmpäristönsuojelunSyy"
      validate={async (value) => {
        if (!value) return true;
        const result = await sap.getEnvironmentalCodeForWbs.fetch({ wbsId: sapWbsId });
        return result?.reasonForEnvironmentalInvestment === value;
      }}
      messages={{
        loading: tr('environmentalCodeSelect.loading'),
        valid: tr('environmentalCodeSelect.valid'),
        invalid: tr('environmentalCodeSelect.invalid'),
        error: tr('environmentalCodeSelect.error'),
      }}
    />
  ) : (
    <CodeSelect {...props} showIdInLabel multiple={false} codeListId="YmpäristönsuojelunSyy" />
  );
}
