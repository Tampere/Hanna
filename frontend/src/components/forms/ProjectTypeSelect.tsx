import { useTranslations } from '@frontend/stores/lang';

import { ProjectType, projectTypes } from '@shared/schema/project/type';

import { MultiSelect } from './MultiSelect';

interface Props {
  id?: string;
  value: ProjectType[];
  onChange: (value: ProjectType[]) => void;
}

export function ProjectTypeSelect({ id, value, onChange }: Props) {
  const tr = useTranslations();
  return (
    <MultiSelect
      id={id}
      options={projectTypes}
      getOptionLabel={(value) => tr(`projectType.${value}`)}
      getOptionId={(code) => String(code)}
      value={value}
      onChange={onChange}
      multiple
    />
  );
}
