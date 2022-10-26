import { css } from '@emotion/react';
import { AddCircle, NavigateNext, UnfoldMore } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';

import { DateRange } from '@frontend/components/DateRange';

const toolbarContainerStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Toolbar() {
  return (
    <Box css={toolbarContainerStyle}>
      <Typography variant="h4">Hankkeet</Typography>
      <div>
        <Button
          component={Link}
          to="/hanke/luo"
          variant="contained"
          size="large"
          style={{ alignItems: 'flex-start' }}
          endIcon={<AddCircle />}
        >
          Luo uusi hanke
        </Button>
      </div>
    </Box>
  );
}

const searchControlContainerStyle = css`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

function SearchControls() {
  return (
    <Paper elevation={1} css={searchControlContainerStyle}>
      <FormControl>
        <FormLabel htmlFor="text-search">Haku</FormLabel>
        <Autocomplete
          id="text-search"
          size="small"
          options={[{ label: 'Test' }]}
          renderInput={(params) => <TextField {...params} placeholder="Hae..."></TextField>}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Hanketyyppi</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>Elinkaaren tila</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>Budjetti</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>Toteutusaikaväli</FormLabel>
        <DateRange />
      </FormControl>
      <FormControl>
        <FormLabel>Rahoitusmalli</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>Lautakunta</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>Omistaja</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <Button size="small" sx={{ gridColumnStart: 4 }} endIcon={<UnfoldMore />}>
        Näytä lisää hakuehtoja
      </Button>
    </Paper>
  );
}

interface Project {
  projectName: string;
}

interface ProjectListingProps {
  projects: Project[];
}

const projectCardStyle = css`
  margin-top: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  :hover {
    background: #eee;
  }
  transition: background 0.5s;
`;

function ProjectListing(props: ProjectListingProps) {
  return (
    <Box>
      {props.projects.map((project) => {
        return (
          <Card variant="outlined" css={projectCardStyle}>
            <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ lineHeight: '120%' }} variant="button">
                {project.projectName}
              </Typography>
              <Typography sx={{ lineHeight: '120%' }} variant="overline">
                01.01.2023 — 31.12.2023
              </Typography>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}

const searchResultContainerStyle = css`
  min-width: 256px;
  padding: 16px;
`;

function SearchResults() {
  const placeHolderResults = [
    { projectName: 'Santalahden rakentaminen' },
    { projectName: 'Pisparannan asuinrakentaminen' },
    { projectName: 'Pahvitehtaan asuinrakentaminen' },
  ];

  return (
    <Paper css={searchResultContainerStyle} elevation={1}>
      <Typography variant="h5">Hakutulokset</Typography>
      <ProjectListing projects={placeHolderResults} />
    </Paper>
  );
}

const resultMapContainerStyle = css`
  padding: 16px;
`;

function ResultsMap() {
  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      Kartta
    </Paper>
  );
}

const projectPageStyle = css`
  display: flex;
  flex-direction: column;
`;

const resultsContainerStyle = css`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
`;

export function Projects() {
  return (
    <Box css={projectPageStyle}>
      <Toolbar />
      <SearchControls />
      <div css={resultsContainerStyle}>
        <SearchResults />
        <ResultsMap />
      </div>
    </Box>
  );
}
