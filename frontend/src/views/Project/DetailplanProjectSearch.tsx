import { Fieldset } from '@frontend/components/Fieldset';
import { useTranslations } from '@frontend/stores/lang';

export function DetailplanProjectSearch() {
  const tr = useTranslations();
  return <Fieldset legend={tr('projectType.detailplanProject')}></Fieldset>;
}
