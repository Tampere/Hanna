import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import { Code, CodeId } from '@shared/schema/code';

import { MultiSelect } from './MultiSelect';

type Props = {
  id?: string;
  readOnly: boolean;
  onBlur: () => void;
  showIdInLabel?: boolean;
  allowEmptySelection?: boolean;
  disableClearable?: boolean;
  projectId?: string;
} & (
  | {
      itemType: 'project';
      value?: CodeId['id'][];
      onChange: (newValue: CodeId['id'][]) => void;
      maxTags?: number;
    }
  | {
      itemType: 'projectObject';
      value?: string;
      onChange: (newValue: string) => void;
      maxTags?: never;
    }
);

export function CommitteeSelect({
  id,
  readOnly,
  onBlur,
  projectId,
  value,
  onChange,
  itemType,
}: Props) {
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const projectCommittees = trpc.project.getCommittees.useQuery(
    { projectId: projectId ?? '' },
    { enabled: itemType === 'projectObject' },
  );
  const committeeCodes = trpc.code.get.useQuery(
    { codeListId: 'Lautakunta' },
    { enabled: itemType === 'project' },
  );

  const assignedCommittees = trpc.project.getCommitteesAssignedToProjectObjects.useQuery(
    {
      projectId: projectId ?? '',
    },
    { enabled: Boolean(projectId) },
  );

  function getCode(id: string) {
    return committeeCodes.data?.find((code) => code.id.id === id);
  }

  function getLabel(code: Code) {
    return [null, code.text[lang]].filter(Boolean).join(' ');
  }

  if (itemType === 'project') {
    return (
      <>
        <MultiSelect
          disableClearable
          id={id}
          readOnly={readOnly}
          onBlur={onBlur}
          options={committeeCodes.data ?? []}
          disabledOptions={
            committeeCodes.data?.filter(
              (committee) =>
                assignedCommittees.data && assignedCommittees.data.includes(committee.id.id),
            ) ?? []
          }
          disabledTooltip={tr('projectForm.committeeDisabledLabel')}
          loading={committeeCodes.isLoading}
          getOptionLabel={getLabel}
          getOptionId={(committee) => committee.id.id}
          value={(value?.map(getCode).filter(Boolean) ?? []) as Code[]}
          onChange={(committees) => onChange(committees.map((committee) => committee.id.id))}
          multiple={true}
        />
      </>
    );
  }

  return (
    <>
      <MultiSelect
        disableClearable
        id={id}
        readOnly={readOnly || !projectId}
        onBlur={onBlur}
        options={projectCommittees.data ?? []}
        loading={projectCommittees.isLoading}
        getOptionLabel={(committee) => committee.text}
        getOptionId={(committee) => committee.typeId}
        value={value}
        onChange={(committee) => onChange(committee.typeId)}
        multiple={false}
      />
    </>
  );
}
