import { css } from '@emotion/react';
import { Add, Cancel } from '@mui/icons-material';
import { Autocomplete, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';

import { DbProject } from '@shared/schema/project';

const rowStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const columnStyle = css`
  display: flex;
  flex-direction: column;
`;

const addIconButtonStyle = css`
  color: #22437b;
  background-color: #d7e4f7;
  font-size: 0.5rem;
`;

const relationStyle = css`
  /* background-color: #f3f3fc; */
  background-color: #d7e4f7;
  /* opacity: 0.1; */
  padding: 0.25rem;
  border-radius: 4px;
  border: 1px solid #22437b;
`;

const linkStyle = css`
  color: black;
  :hover {
    color: #22437b;
  }
`;

const relationContainer = css`
  border-bottom: 1px solid black;
  padding-bottom: 0.25rem;
  padding-top: 0.25rem;
`;

const projectLinkContainer = css`
  /* display: flex;
  flex-direction: row; */
  padding-bottom: 0.75rem;
`;

const noRelationsText = css`
  font-style: italic;
  color: grey;
  font-size: 0.9rem;
`;

interface Props {
  project: DbProject;
}

export function ProjectRelations({ project }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>('');
  const [projectSearch, setProjectSearch] = useState<{
    isOpen: boolean;
    ref?: 'parent' | 'child' | 'related' | '';
  }>({
    isOpen: false,
    ref: '',
  });

  const relations = trpc.project.getRelations.useQuery(
    { id: project?.id },
    { enabled: Boolean(project?.id), queryKey: ['project.getRelations', { id: project?.id }] }
  );

  const currentlyRelatedProjects = [
    ...(relations.data?.relations.children?.map((child) => child.projectName) ?? []),
    ...(relations.data?.relations.parents?.map((child) => child.projectName) ?? []),
    ...(relations.data?.relations.related?.map((child) => child.projectName) ?? []),
  ];

  const projects = trpc.project.search.useQuery({
    dateRange: { startDate: '2022-01-01', endDate: '2022-12-31' },
    lifecycleStates: [],
    projectTypes: [],
    financingTypes: [],
    text: useDebounce('', 250),
  });

  const relationsUpdate = trpc.project.updateRelations.useMutation({
    onSuccess: () => {
      relations.refetch();
      setSelectedProjectName('');
      notify({
        severity: 'success',
        title: tr('projectRelations.notifyAddedRelation'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'success',
        title: tr('projectRelations.notifyAddedRelationFailure'),
        duration: 5000,
      });
    },
  });

  const deleteRelation = trpc.project.remoteRelation.useMutation({
    onSuccess: () => {
      relations.refetch();
      notify({
        severity: 'success',
        title: tr('projectRelations.relationRemoved'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'success',
        title: tr('projectRelations.relationRemovalFailed'),
        duration: 5000,
      });
    },
  });

  function addProjectRelation() {
    if (
      !project ||
      !projectSearch.ref ||
      !projects.data ||
      !projects.data.map((project) => project.projectName).includes(selectedProjectName)
    )
      return;

    relationsUpdate.mutate({
      projectId: project.id,
      targetProjectId: projects.data.find((project) => project.projectName === selectedProjectName)
        ?.id as any,
      relation: projectSearch.ref,
    });
  }

  function removeProjectRelation(relation: string, targetProjectId: string) {
    deleteRelation.mutate({
      projectId: project.id,
      targetProjectId: targetProjectId,
      relation: relation as any,
    });
  }

  function ProjectSearch() {
    return (
      <Box>
        <Box css={rowStyle}>
          <Autocomplete
            id="project-relation-search"
            options={
              projects.data
                ?.map((project) => project.projectName)
                .filter((projectName) => projectName !== project.projectName)
                .filter((projectName) => !currentlyRelatedProjects.includes(projectName)) ?? []
            }
            noOptionsText={'Hakua vastaavia hankkeita ei löytynyt'}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Hanke" />}
            loading={projects.isLoading}
            onChange={(event: any, newValue: string | null) => {
              setSelectedProjectName(newValue);
            }}
            value={selectedProjectName}
          />
        </Box>
        <Box css={rowStyle} style={{ marginTop: '0.5rem' }}>
          <Button
            variant="contained"
            size="small"
            style={{ marginRight: '0.5rem' }}
            onClick={() => {
              setProjectSearch({ isOpen: false, ref: '' });
              addProjectRelation();
            }}
          >
            LISÄÄ
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setProjectSearch({ isOpen: false, ref: '' });
              setSelectedProjectName('');
            }}
          >
            PERUUTA
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <div>
      {/* Parent */}
      <Box css={relationContainer}>
        <Box css={rowStyle} style={{ justifyContent: 'space-between' }}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.parentRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle ylähanke'}>
            <IconButton
              size="small"
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'parent' })}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.parents?.map((parent: any, index: number) => (
            <Box css={projectLinkContainer} key={`parent-idx-${index}`}>
              <span css={relationStyle}>
                <Tooltip
                  title={tr('projectRelations.gotoProject').replace('{x}', parent.projectName)}
                >
                  <Link css={linkStyle} to={`/hanke/${parent.projectId}`}>
                    {parent.projectName}
                  </Link>
                </Tooltip>
              </span>
              <Tooltip title={tr('projectRelations.removeRelation')}>
                <IconButton
                  size="small"
                  onClick={() => {
                    removeProjectRelation('parent', parent.projectId);
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )) ??
            (projectSearch.ref !== 'parent' && (
              <Typography css={noRelationsText}> Ei ylähankkeita </Typography>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'parent' && <ProjectSearch />}
      </Box>
      {/* Child */}
      <Box css={relationContainer}>
        <Box css={rowStyle} style={{ justifyContent: 'space-between' }}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.childRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle alahanke'}>
            <IconButton
              size="small"
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'child' })}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.children?.map((child: any, index: number) => (
            <Box css={projectLinkContainer} key={`child-idx-${index}`}>
              <span css={relationStyle}>
                <Tooltip
                  title={tr('projectRelations.gotoProject').replace('{x}', child.projectName)}
                >
                  <Link css={linkStyle} to={`/hanke/${child.projectId}`}>
                    {child.projectName}
                  </Link>
                </Tooltip>
              </span>
              <Tooltip title={tr('projectRelations.removeRelation')}>
                <IconButton
                  size="small"
                  onClick={() => {
                    removeProjectRelation('child', child.projectId);
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )) ??
            (projectSearch.ref !== 'child' && (
              <Typography css={noRelationsText}> Ei alahankkeita </Typography>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'child' && <ProjectSearch />}
      </Box>
      {/* Related */}
      <Box css={relationContainer}>
        <Box css={rowStyle} style={{ justifyContent: 'space-between' }}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.relatedRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle rinnakkaishanke'}>
            <IconButton
              size="small"
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'related' })}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.related?.map((related: any, index: number) => (
            <Box css={projectLinkContainer} key={`related-idx-${index}`}>
              <span css={relationStyle}>
                <Tooltip
                  title={tr('projectRelations.gotoProject').replace('{x}', related.projectName)}
                >
                  <Link css={linkStyle} to={`/hanke/${related.projectId}`}>
                    {related.projectName}
                  </Link>
                </Tooltip>
              </span>
              <Tooltip title={tr('projectRelations.removeRelation')}>
                <IconButton
                  size="small"
                  onClick={() => {
                    removeProjectRelation('related', related.projectId);
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )) ??
            (projectSearch.ref !== 'related' && (
              <Typography css={noRelationsText}> Ei rinnakkaishankkeita </Typography>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'related' && <ProjectSearch />}
      </Box>
    </div>
  );
}
