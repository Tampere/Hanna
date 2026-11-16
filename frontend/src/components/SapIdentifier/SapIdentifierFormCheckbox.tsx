import { Box, Checkbox, FormControlLabel, FormHelperText } from '@mui/material';
import { useEffect } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  /** Saved project id; for a new hanke leave empty. For a kohde, the parent hanke. */
  projectId?: string | null;
  /** Saved kohde id when this is a kohde form (null for a new kohde). */
  projectObjectId?: string | null;
  isProjectObject: boolean;
  /** Current value of the identifier field in the form (SAP project id / WBS id). */
  formIdentifier?: string | null;
  editing: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * "Ilmoita samalla talousjärjestelmään" checkbox for the hanke/kohde forms. Shown
 * while editing when the item has no identifier and no open request. For a kohde
 * the parent hanke must already have a SAP project id.
 */
export function SapIdentifierFormCheckbox({
  projectId,
  projectObjectId,
  isProjectObject,
  formIdentifier,
  editing,
  checked,
  onChange,
}: Readonly<Props>) {
  const tr = useTranslations();

  const ownStatus = trpc.sapIdentifier.getStatus.useQuery(
    { projectId: projectId as string, projectObjectId: projectObjectId ?? null },
    { enabled: Boolean(projectId && (!isProjectObject || projectObjectId)) },
  );
  const parentStatus = trpc.sapIdentifier.getStatus.useQuery(
    { projectId: projectId as string, projectObjectId: null },
    { enabled: Boolean(isProjectObject && projectId) },
  );

  const isSaved = Boolean(isProjectObject ? projectObjectId : projectId);
  const visible =
    editing &&
    !formIdentifier &&
    (!isSaved || (ownStatus.data && !ownStatus.data.identifier && !ownStatus.data.openRequest)) &&
    (!isProjectObject || Boolean(parentStatus.data?.identifier));

  // Don't keep a hidden checkbox checked (e.g. identifier typed in or editing cancelled)
  useEffect(() => {
    if (!visible && checked) onChange(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <Box>
      <FormControlLabel
        label={tr('sapIdentifier.formCheckbox.label')}
        control={<Checkbox checked={checked} onChange={(_, value) => onChange(value)} />}
      />
      {checked && <FormHelperText>{tr('sapIdentifier.formCheckbox.help')}</FormHelperText>}
    </Box>
  );
}
