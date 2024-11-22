import { Create, Undo } from '@mui/icons-material';
import { Button, css } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { SplitButton } from '@frontend/components/SplitButton';
import { useTranslations } from '@frontend/stores/lang';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';

import { ProjectShiftView } from './ProjectShiftView';

interface Props {
  isNewItem: boolean;
  isSubmitting: boolean;
  isOwner: boolean;
  canWrite: boolean;
  forProjectObject: boolean;
  onCancel: () => void;
  projectType?: ProjectTypePath;
}

export function ModifyButton({
  isNewItem,
  isSubmitting,
  isOwner,
  canWrite,
  forProjectObject,
  onCancel,
  projectType,
}: Props) {
  const tr = useTranslations();
  const [dateShiftPopupOpen, setDateShiftPopupOpen] = useState(false);

  const navigate = useNavigate();
  const { projectId } = useParams() as { projectId?: string };
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const dirtyAndValidViews = useAtomValue(dirtyAndValidFieldsAtom);
  const [editing, setEditing] = useAtom(projectEditingAtom);

  if (isNewItem) {
    return (
      <Button
        css={css`
          margin: 0 0 0 auto;
        `}
        disabled={isSubmitting}
        size="small"
        startIcon={<Undo />}
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() => navigate(-1)}
      >
        {tr('cancel')}
      </Button>
    );
  }

  if (forProjectObject) {
    return (
      <Button
        css={css`
          margin-left: auto;
        `}
        onClick={() => {
          if (editing) {
            onCancel();
            return;
          }
          if (searchParams.get('tab')) {
            // Navigate back to default map tab if user starts editing
            navigate(location.pathname);
          }
          setEditing(true);
        }}
        disabled={
          (!isOwner && !canWrite) ||
          isSubmitting ||
          dirtyAndValidViews.finances.isDirtyAndValid ||
          dirtyAndValidViews.permissions.isDirtyAndValid
        }
        variant={editing ? 'outlined' : 'contained'}
        size="small"
        endIcon={editing ? <Undo /> : <Create />}
      >
        {editing
          ? tr('cancel')
          : forProjectObject
            ? tr('projectObjectView.modify')
            : tr('projectView.modify')}
      </Button>
    );
  }

  return (
    <>
      <SplitButton
        hideSelectedOptionFromList
        disableButtonSelection={editing || dateShiftPopupOpen}
        cssProp={css`
          margin-left: auto;
        `}
        variant={editing ? 'outlined' : 'contained'}
        options={[
          forProjectObject ? tr('projectObjectView.modify') : tr('projectView.modify'),
          tr('projectView.projectShiftButtonLabel'),
        ]}
        renderButton={(label, idx) => (
          <Button
            onClick={() => {
              if (editing) {
                onCancel();
                return;
              }

              if (idx === 0) {
                if (searchParams.get('tab')) {
                  // Navigate back to default map tab if user starts editing
                  navigate(location.pathname);
                }
                setEditing(true);
              } else {
                setDateShiftPopupOpen(true);
              }
            }}
            disabled={
              dateShiftPopupOpen ||
              (!isOwner && !canWrite) ||
              isSubmitting ||
              dirtyAndValidViews.finances.isDirtyAndValid ||
              dirtyAndValidViews.permissions.isDirtyAndValid
            }
            variant={editing ? 'outlined' : 'contained'}
            size="small"
            endIcon={editing ? <Undo /> : <Create />}
          >
            {editing ? tr('cancel') : label}
          </Button>
        )}
      />
      {dateShiftPopupOpen && projectId && (
        <ProjectShiftView
          projectType={projectType}
          projectId={projectId}
          handleClose={() => {
            setDateShiftPopupOpen(false);
            queryClient.invalidateQueries();
          }}
        />
      )}
    </>
  );
}
