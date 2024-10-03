import { Close, Create, Save, Undo } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';

import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import {
  DirtyAndValidFields,
  ModifiableField,
  dirtyAndValidFieldsAtom,
  projectEditingAtom,
} from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';

import {
  ProjectPermissionContext,
  hasWritePermission,
  ownsProject,
} from '@shared/schema/userPermissions';

import { DeleteProjectObjectDialog } from '../ProjectObject/DeleteProjectObjectDialog';
import { SaveOptionsButton } from '../ProjectObject/SaveOptionsButton';
import { DeleteProjectDialog } from './DeleteProjectDialog';

interface EditingFooterProps extends PropsWithChildren {
  onSave: () => void;
  onCancel: () => void;
  saveAndReturn?: (navigateTo: string) => void;
  isSubmitting?: boolean;
  isNewItem: boolean;
}

export function EditingFooter({
  onSave,
  saveAndReturn,
  onCancel,
  isSubmitting,
  children,
  isNewItem,
}: EditingFooterProps) {
  const { form, map, finances, permissions } = useAtomValue(dirtyAndValidFieldsAtom);
  const location = useLocation();
  const navigateTo = new URLSearchParams(location.search).get('from');

  const isReadyToSubmit = isNewItem
    ? form.isValid
    : form.isDirty
      ? form.isValid
      : map.isDirtyAndValid || finances.isDirtyAndValid || permissions.isDirtyAndValid;
  const tr = useTranslations();
  return (
    <Box
      css={css`
        width: 100%;
        background-color: white;
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
      `}
    >
      {children}
      <Button
        disabled={isSubmitting}
        size="small"
        variant="outlined"
        color="primary"
        onClick={onCancel}
        endIcon={<Close />}
      >
        {tr('reject')}
      </Button>
      {navigateTo && saveAndReturn ? (
        <SaveOptionsButton
          disabled={!isReadyToSubmit}
          saveAndReturn={() => saveAndReturn(navigateTo)}
        >
          <Button disabled={!isReadyToSubmit} size="small" variant="outlined" onClick={onSave}>
            {tr('save')}
          </Button>
        </SaveOptionsButton>
      ) : (
        <Button
          disabled={!isReadyToSubmit || isSubmitting}
          size="small"
          variant="contained"
          color="primary"
          onClick={onSave}
          endIcon={isSubmitting ? <CircularProgress size="1rem" /> : <Save />}
        >
          {tr('save')}
        </Button>
      )}
    </Box>
  );
}

interface RefContent {
  form: {
    onSave: (geom?: string) => Promise<void>;
    saveAndReturn?: (navigateTo: string, geom?: string) => void;
    onCancel: () => void;
  };
  map: { handleUndoDraw: () => void; handleSave: () => Promise<void>; getGeometry: () => string };
  finances: { onSave: () => Promise<void>; onCancel: () => void };
  permissions: { onSave: () => Promise<void>; onCancel: () => void };
}

interface TabRefs {
  form: React.RefObject<RefContent['form']>;
  map: React.RefObject<RefContent['map']>;
  finances: React.RefObject<RefContent['finances']>;
  permissions: React.RefObject<RefContent['permissions']>;
}

interface Props {
  renderHeaderContent?: () => JSX.Element;
  renderMainContent?: (tabRefs: TabRefs) => JSX.Element;
  handleFormCancel?: (formRef: TabRefs['form']) => void;
  permissionCtx: ProjectPermissionContext | null;
  type?: 'project' | 'projectObject';
  projectType?: ProjectTypePath;
}

export function ProjectViewWrapper({ type = 'project', ...props }: Props) {
  const { projectId, projectObjectId } = useParams() as {
    projectId: string;
    projectObjectId?: string;
  };

  const isNewItem =
    (type === 'project' && !projectId) || (type === 'projectObject' && !projectObjectId);

  const tr = useTranslations();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [editing, setEditing] = useAtom(projectEditingAtom);
  const dirtyAndValidViews = useAtomValue(dirtyAndValidFieldsAtom);
  const user = useAtomValue(asyncUserAtom);
  const footerVisible =
    editing ||
    dirtyAndValidViews.finances.isDirtyAndValid ||
    dirtyAndValidViews.permissions.isDirtyAndValid;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabRefs: TabRefs = {
    form: useRef(null),
    map: useRef(null),
    finances: useRef(null),
    permissions: useRef(null),
  };

  const viewSaveActions = {
    form: async () => {
      if (!dirtyAndValidViews.map.isDirtyAndValid) {
        await tabRefs.form.current?.onSave();
      }
    },
    map: async () => {
      if (dirtyAndValidViews.form.isValid) {
        const geom = tabRefs.map.current?.getGeometry();
        await tabRefs.form.current?.onSave(geom);
      } else {
        await tabRefs.map.current?.handleSave();
      }
    },
    finances: tabRefs.finances.current?.onSave,
    permissions: tabRefs.permissions.current?.onSave,
  };

  async function onSave() {
    setIsSubmitting(true);
    try {
      await Promise.all(
        Object.entries(dirtyAndValidViews).map(async ([view, status]) => {
          if (status.isValid || status.isDirtyAndValid) {
            await viewSaveActions[view as keyof DirtyAndValidFields]?.();
          }
        }),
      );
    } catch {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    setEditing(false);
  }

  const viewCancelActions = {
    form: () => props.handleFormCancel?.(tabRefs.form),
    map: tabRefs.map.current?.handleUndoDraw,
    finances: tabRefs.finances.current?.onCancel,
    permissions: tabRefs.permissions.current?.onCancel,
  };

  function onCancel() {
    if (isNewItem) {
      // If navigating back from new item creation, mapwrapper sets editing to false
      navigate(-1);
      return;
    }

    (Object.keys(dirtyAndValidViews) as ModifiableField[]).forEach(
      (view) => viewCancelActions[view]?.(),
    );
    setEditing(false);
  }

  useEffect(() => {
    setEditing(isNewItem);
    return () => setEditing(false);
  }, [projectId]);

  const isOwner = props.permissionCtx ? ownsProject(user, props.permissionCtx) : false;
  const canWrite = props.permissionCtx ? hasWritePermission(user, props.permissionCtx) : false;

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        margin: 0 -16px;
      `}
    >
      <Box
        className="header"
        css={css`
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 0 16px;
        `}
      >
        {props.renderHeaderContent?.()}
        {isNewItem ? (
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
        ) : (
          <Button
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
            css={css`
              margin-left: auto;
            `}
            endIcon={editing ? <Undo /> : <Create />}
          >
            {editing
              ? tr('cancel')
              : projectObjectId
                ? tr('projectObjectView.modify')
                : tr('projectView.modify')}
          </Button>
        )}
      </Box>
      {props.renderMainContent?.(tabRefs)}
      <Box
        className="footer"
        css={css`
          transition:
            height 0.2s ease-in-out,
            opacity 0.2s ease-in-out;
          opacity: ${footerVisible ? 1 : 0};
          border-top: ${footerVisible ? '1px solid #e0e0e0' : 'none'};
          box-shadow: 2px -1px 4px #e3e3e3;
          height: ${footerVisible ? '70px' : '0px'};
          z-index: 300;
          display: flex;
          align-items: center;
          padding: ${footerVisible ? '0 16px' : '0'};
          margin: ${footerVisible ? '16px 0 -16px 0' : '0'};
        `}
      >
        {footerVisible && (
          <EditingFooter
            isNewItem={isNewItem}
            isSubmitting={isSubmitting}
            onSave={onSave}
            saveAndReturn={(navigateTo) => {
              let geom: string | undefined;
              if (dirtyAndValidViews.map.isDirtyAndValid) {
                geom = tabRefs.map.current?.getGeometry();
              }
              tabRefs.form.current?.saveAndReturn?.(navigateTo, geom);
            }}
            onCancel={onCancel}
          >
            {props.permissionCtx &&
              editing &&
              (type === 'project' ? (
                <DeleteProjectDialog
                  cssProp={css`
                    margin-right: auto;
                  `}
                  disabled={!isOwner || isSubmitting}
                  projectId={projectId}
                  message={tr('project.deleteDialogMessage')}
                />
              ) : (
                props.projectType &&
                projectObjectId && (
                  <DeleteProjectObjectDialog
                    cssProp={css`
                      margin-right: auto;
                    `}
                    projectId={projectId}
                    projectType={props.projectType}
                    projectObjectId={projectObjectId}
                    userCanModify={isOwner || canWrite}
                  />
                )
              ))}
            {isNewItem &&
              props.projectType !== 'asemakaavahanke' &&
              !dirtyAndValidViews.map.isDirtyAndValid && (
                <Alert
                  css={css`
                    padding: 0px 16px;
                    height: min-content;
                    align-items: center;
                    & .MuiAlert-message {
                      padding: 4px 0;
                    }
                    & .MuiAlert-icon {
                      padding: 4px 0;
                    }
                  `}
                  severity="info"
                >
                  {type === 'project'
                    ? tr('newProject.infoNoGeom')
                    : tr('projectObjectForm.infoNoGeom')}
                </Alert>
              )}
          </EditingFooter>
        )}
      </Box>
    </Box>
  );
}
