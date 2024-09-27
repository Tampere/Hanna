import { Close, Create, Save, Undo } from '@mui/icons-material';
import { Alert, Box, Button, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import {
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
}

export function EditingFooter({ onSave, saveAndReturn, onCancel, children }: EditingFooterProps) {
  const dirtyAndValidViews = useAtomValue(dirtyAndValidFieldsAtom);
  const location = useLocation();
  const navigateTo = new URLSearchParams(location.search).get('from');
  const isReadyToSubmit = Object.values(dirtyAndValidViews).some((status) => Boolean(status));
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
          disabled={!isReadyToSubmit}
          size="small"
          variant="contained"
          color="primary"
          onClick={onSave}
          endIcon={<Save />}
        >
          {tr('save')}
        </Button>
      )}
    </Box>
  );
}

interface RefContent {
  form: {
    onSave: (geom?: string) => void;
    saveAndReturn?: (navigateTo: string, geom?: string) => void;
    onCancel: () => void;
  };
  map: { handleUndoDraw: () => void; handleSave: () => string };
  finances: { onSave: () => void; onCancel: () => void };
  permissions: { onSave: () => void; onCancel: () => void };
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
  geom?: string | null;
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

  const [editing, setEditing] = useAtom(projectEditingAtom);
  const dirtyAndValidViews = useAtomValue(dirtyAndValidFieldsAtom);
  const user = useAtomValue(asyncUserAtom);
  const footerVisible = editing || dirtyAndValidViews.finances;

  const tabRefs: TabRefs = {
    form: useRef(null),
    map: useRef(null),
    finances: useRef(null),
    permissions: useRef(null),
  };

  const viewSaveActions = {
    form: () => {
      if (!dirtyAndValidViews.map) {
        tabRefs.form.current?.onSave();
      }
    },
    map: () => {
      const geom = tabRefs.map.current?.handleSave();
      tabRefs.form.current?.onSave(geom);
    },
    finances: tabRefs.finances.current?.onSave,
    permissions: tabRefs.permissions.current?.onSave,
  };

  function onSave() {
    (Object.entries(dirtyAndValidViews) as [ModifiableField, boolean][]).forEach(
      ([view, isDirty]) => {
        if (isDirty) {
          viewSaveActions[view]?.();
        }
      },
    );

    setEditing(false);
  }

  const viewCancelActions = {
    form: () => props.handleFormCancel?.(tabRefs.form),
    map: tabRefs.map.current?.handleUndoDraw,
    finances: tabRefs.finances.current?.onCancel,
    permissions: tabRefs.permissions.current?.onCancel,
  };

  function onCancel() {
    (Object.keys(dirtyAndValidViews) as ModifiableField[]).forEach(
      (view) => viewCancelActions[view]?.(),
    );

    if (isNewItem) {
      navigate(-1);
    }
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
            size="small"
            startIcon={<Undo />}
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate(-1)}
          >
            {tr('cancel')}
          </Button>
        ) : (
          <Button
            onClick={() => (editing ? onCancel() : setEditing(true))}
            disabled={!isOwner && !canWrite}
            variant="contained"
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
            onSave={onSave}
            saveAndReturn={(navigateTo) => {
              let geom: string | undefined;
              if (dirtyAndValidViews.map) {
                geom = tabRefs.map.current?.handleSave();
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
                  disabled={!isOwner}
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
            {isNewItem && (!props.geom || props.geom === '[]') && (
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
