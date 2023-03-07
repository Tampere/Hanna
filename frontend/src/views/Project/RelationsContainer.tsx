import { css } from '@emotion/react';
import { Add, Cancel } from '@mui/icons-material';
import { Autocomplete, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';

import { ProjectRelation, Relation } from '@shared/schema/project';
import { DbCommonProject } from '@shared/schema/project/common';

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
  background-color: #d7e4f7;
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
  padding-bottom: 0.75rem;
`;

const noRelationsTextStyle = css`
  font-style: italic;
  color: grey;
  font-size: 0.9rem;
`;

interface Props {
  title: string;
  addRelationText: string;
  noRelationsText: string;
  relationType: Relation;
  relations: ProjectRelation[];
  unrelatableProjectIds: string[];
  onRemoveProjectRelation: (relationType: Relation, relationObjectId: string) => void;
  onAddProjectRelation: (relationType: Relation, relationObjectId: string) => void;
}

export function RelationsContainer({
  title,
  addRelationText,
  noRelationsText,
  relations,
  relationType,
  unrelatableProjectIds,
  onRemoveProjectRelation,
  onAddProjectRelation,
}: Props) {
  const tr = useTranslations();
  const [showProjectSearch, setShowProjectSearch] = useState(false);
  const [selectedObjectProjectId, setSelectedObjectProjectId] = useState<string | null>(null);

  const projects = trpc.project.search.useQuery({
    text: useDebounce('', 250),
  });

  function ProjectRelationSearch() {
    return (
      <Box>
        <Box css={rowStyle}>
          <Autocomplete
            id="project-relation-search"
            options={
              projects?.data?.projects.filter(
                (project: DbCommonProject) => !unrelatableProjectIds.includes(project.id)
              ) ?? []
            }
            noOptionsText={tr('projectRelations.noFoundProjects')}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField {...params} label={tr('project.projectNameLabel')} />
            )}
            size="small"
            getOptionLabel={(option: DbCommonProject) => option.projectName}
            loading={projects.isLoading}
            onChange={(event: React.SyntheticEvent, newValue: DbCommonProject | null) => {
              setSelectedObjectProjectId(newValue?.id ?? null);
            }}
            value={projects?.data?.projects?.find(
              (project: DbCommonProject) => project.id === selectedObjectProjectId
            )}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box css={relationContainer}>
      <Box css={rowStyle} style={{ justifyContent: 'space-between' }}>
        <Typography style={{ fontSize: '0.9rem' }}>{title}</Typography>
        <Tooltip title={addRelationText}>
          <IconButton
            size="small"
            css={addIconButtonStyle}
            onClick={() => setShowProjectSearch(true)}
          >
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box css={columnStyle}>
        {relations?.map((objectOfRelation: ProjectRelation, index: number) => (
          <Box css={projectLinkContainer} key={`relation-index-${index}`}>
            <span css={relationStyle}>
              <Tooltip
                title={tr('projectRelations.gotoProject').replace(
                  '{x}',
                  objectOfRelation.projectName
                )}
              >
                <Link css={linkStyle} to={`/hanke/${objectOfRelation.projectId}`}>
                  {objectOfRelation.projectName}
                </Link>
              </Tooltip>
            </span>
            <Tooltip title={tr('projectRelations.removeRelation')}>
              <IconButton
                size="small"
                onClick={() => {
                  onRemoveProjectRelation(relationType, objectOfRelation.projectId);
                }}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )) ??
          (!showProjectSearch && (
            <Typography css={noRelationsTextStyle}> {noRelationsText} </Typography>
          ))}
      </Box>
      {showProjectSearch && (
        <>
          <ProjectRelationSearch />
          <Box css={rowStyle} style={{ marginTop: '0.5rem' }}>
            <Button
              variant="contained"
              size="small"
              style={{ marginRight: '0.5rem' }}
              onClick={() => {
                if (!selectedObjectProjectId) return;
                onAddProjectRelation(relationType, selectedObjectProjectId);
                setSelectedObjectProjectId(null);
                setShowProjectSearch(false);
              }}
            >
              {tr('add').toLocaleUpperCase()}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setSelectedObjectProjectId(null);
                setShowProjectSearch(false);
              }}
            >
              {tr('cancel').toLocaleUpperCase()}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
