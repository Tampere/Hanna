import { css } from '@emotion/react';
import { Add } from '@mui/icons-material';
import { Autocomplete, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

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
  font-size: 0.5rem;
`;

const relationStyle = css`
  background-color: #f0f6ff;
  padding: 0.25rem;
  border-radius: 2px;
  border: 1px solid grey;
`;

const relationContainer = css`
  border-bottom: 1px solid black;
  padding-bottom: 0.25rem;
`;

const projectLinkContainer = css`
  padding-bottom: 0.75rem;
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
    ref?: 'parent' | 'child' | 'related';
  }>({
    isOpen: false,
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
              setProjectSearch({ isOpen: false, ref: 'child' });
              addProjectRelation();
            }}
          >
            LISÄÄ
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setProjectSearch({ isOpen: false, ref: 'child' });
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
      <Box css={relationContainer}>
        <Box css={rowStyle}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.parentRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle ylähanke'}>
            <IconButton
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'parent' })}
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.parents?.map((parent: any, index: number) => (
            <Box css={projectLinkContainer} key={`parent-idx-${index}`}>
              <span css={relationStyle}>
                <a href={`/hanke/${parent.projectId}`}>{parent.projectName}</a>
              </span>
            </Box>
          )) ??
            (!projectSearch.isOpen && (
              <span style={{ fontStyle: 'italic', color: 'grey', fontSize: '0.9rem' }}>
                {' '}
                Ei ylähankkeita{' '}
              </span>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'parent' && <ProjectSearch />}
      </Box>
      <Box css={relationContainer}>
        <Box css={rowStyle}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.childRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle alahanke'}>
            <IconButton
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'child' })}
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.children?.map((child: any, index: number) => (
            <Box css={projectLinkContainer} key={`child-idx-${index}`}>
              <span css={relationStyle}>
                <a href={`/hanke/${child.projectId}`}>{child.projectName}</a>
              </span>
            </Box>
          )) ??
            (!projectSearch.isOpen && (
              <span style={{ fontStyle: 'italic', color: 'grey', fontSize: '0.9rem' }}>
                {' '}
                Ei alahankkeita{' '}
              </span>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'child' && <ProjectSearch />}
      </Box>
      <Box style={{ paddingBottom: '1rem' }}>
        <Box css={rowStyle}>
          <Typography style={{ fontSize: '0.9rem' }}>
            {tr('projectRelations.relatedRelations').toLocaleUpperCase()}
          </Typography>
          <Tooltip title={'Lisää hankkeelle rinnakkaishanke'}>
            <IconButton
              css={addIconButtonStyle}
              onClick={() => setProjectSearch({ isOpen: true, ref: 'related' })}
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        <Box css={columnStyle}>
          {relations?.data?.relations.related?.map((related: any, index: number) => (
            <Box css={projectLinkContainer} key={`related-idx-${index}`}>
              <span css={relationStyle}>
                <a href={`/hanke/${related.projectId}`}>{related.projectName}</a>
              </span>
            </Box>
          )) ??
            (!projectSearch.isOpen && (
              <span style={{ fontStyle: 'italic', color: 'grey', fontSize: '0.9rem' }}>
                {' '}
                Ei rinnakkaishankkeita{' '}
              </span>
            ))}
        </Box>
        {projectSearch.isOpen && projectSearch.ref === 'related' && <ProjectSearch />}
      </Box>
    </div>
  );
}
