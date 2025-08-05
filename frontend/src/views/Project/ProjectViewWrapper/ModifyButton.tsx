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

import { ProjectObjectMoveView } from './ProjectObjectMoveView';
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
  const [popupOpen, setPopupOpen] = useState(false);

  const navigate = useNavigate();
  const { projectId, projectObjectId } = useParams() as {
    projectId?: string;
    projectObjectId?: string;
  };
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

  const editingDisabled =
    popupOpen ||
    (!isOwner && !canWrite) ||
    isSubmitting ||
    dirtyAndValidViews.finances.isDirtyAndValid ||
    dirtyAndValidViews.permissions.isDirtyAndValid ||
    projectType === 'asemakaavahanke';

  if (forProjectObject) {
    return (
      <>
        <SplitButton
          hideSelectedOptionFromList
          hideButtonSelection={editing || !isOwner}
          disableButtonSelection={editingDisabled}
          cssProp={css`
            margin-left: auto;
          `}
          variant={editing ? 'outlined' : 'contained'}
          options={[tr('projectObjectView.modify'), tr('projectObjectView.moveToProjectButton')]}
          directOptionFunctions={[null, () => setPopupOpen(true)]}
          renderButton={(label, idx) => (
            <Button
              css={css`
                margin-left: auto;
              `}
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
                }
              }}
              disabled={editingDisabled}
              variant={editing ? 'outlined' : 'contained'}
              size="small"
              endIcon={editing ? <Undo /> : <Create />}
            >
              {editing ? tr('cancel') : label}
            </Button>
          )}
        />
        {popupOpen && projectObjectId && (
          <ProjectObjectMoveView
            projectObjectId={projectObjectId}
            handleClose={() => {
              setPopupOpen(false);
              queryClient.invalidateQueries();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <SplitButton
        hideSelectedOptionFromList
        hideButtonSelection={editing}
        disableButtonSelection={editingDisabled}
        cssProp={css`
          margin-left: auto;
        `}
        variant={editing ? 'outlined' : 'contained'}
        options={[tr('projectView.modify'), tr('projectView.projectShiftButtonLabel')]}
        directOptionFunctions={[null, () => setPopupOpen(true)]}
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
              }
            }}
            disabled={editingDisabled}
            variant={editing ? 'outlined' : 'contained'}
            size="small"
            endIcon={editing ? <Undo /> : <Create />}
          >
            {editing ? tr('cancel') : label}
          </Button>
        )}
      />
      {popupOpen && projectId && (
        <ProjectShiftView
          projectType={projectType}
          projectId={projectId}
          handleClose={() => {
            setPopupOpen(false);
            queryClient.invalidateQueries();
          }}
        />
      )}
    </>
  );
}
