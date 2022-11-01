import { css } from '@emotion/react';
import { AddCircle, NavigateNext, UnfoldMore } from '@mui/icons-material';
import {
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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { client } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { ProjectSearch, SearchResult } from '@shared/schema/project';

const toolbarContainerStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Toolbar() {
  const tr = useTranslations();
  return (
    <Box css={toolbarContainerStyle}>
      <Typography variant="h4">{tr['pages.projectsTitle']}</Typography>
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
  const tr = useTranslations();

  return (
    <Paper elevation={1} css={searchControlContainerStyle}>
      <FormControl>
        <FormLabel htmlFor="text-search">{tr['projectSearch.textSearchLabel']}</FormLabel>
        <TextField id="text-search" size="small" placeholder={tr['projectSearch.textSearchTip']} />
      </FormControl>
      <FormControl>
        <FormLabel>{tr['project.projectTypeLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>{tr['project.lifecycleStateLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>{tr['project.budgetLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <Box sx={{ display: 'flex' }}>
        <FormControl>
          <FormLabel>{tr['project.startDateLabel']}</FormLabel>
          <TextField type="date" size="small" fullWidth />
        </FormControl>
        <FormControl sx={{ ml: 2 }}>
          <FormLabel>{tr['project.endDateLabel']}</FormLabel>
          <TextField type="date" size="small" fullWidth />
        </FormControl>
      </Box>
      <FormControl>
        <FormLabel>{tr['project.financingTypeLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>{tr['project.committeeLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <FormControl>
        <FormLabel>{tr['project.ownerLabel']}</FormLabel>
        <Select size="small"></Select>
      </FormControl>
      <Button size="small" sx={{ gridColumnStart: 4 }} endIcon={<UnfoldMore />}>
        {tr['projectSearch.showMoreBtnLabel']}
      </Button>
    </Paper>
  );
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

const searchResultContainerStyle = css`
  min-width: 256px;
  padding: 16px;
`;

interface SearchResultsProps {
  results: SearchResult;
}

function SearchResults({ results }: SearchResultsProps) {
  const tr = useTranslations();
  return (
    <Paper css={searchResultContainerStyle} elevation={1}>
      <Typography variant="h5">{tr['projectListing.searchResultsTitle']}</Typography>
      {results?.length > 0 ? (
        <Box>
          {results.map((result) => {
            return (
              <Card variant="outlined" css={projectCardStyle}>
                <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ lineHeight: '120%' }} variant="button">
                    {result.projectName}
                  </Typography>
                  <Typography sx={{ lineHeight: '120%' }} variant="overline">
                    {result.startDate.toLocaleDateString()} — {result.endDate.toLocaleDateString()}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Box>
      ) : (
        <span>{tr['projectSearch.noResults']}</span>
      )}
    </Paper>
  );
}

const resultMapContainerStyle = css`
  padding: 16px;
`;

function ResultsMap() {
  return (
    <Paper css={resultMapContainerStyle} elevation={1}>
      Kartta placeholder
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
  const [search, setSearch] = useState<ProjectSearch>({ text: '' });
  const [results, setResults] = useState<SearchResult>([]);

  useEffect(() => {
    async function doSearch() {
      const searchResult = await client.project.search.query(search);
      setResults(searchResult);
    }
    doSearch();
  }, [search]);

  return (
    <Box css={projectPageStyle}>
      <Toolbar />
      <SearchControls />
      <div css={resultsContainerStyle}>
        <SearchResults results={results} />
        <ResultsMap />
      </div>
    </Box>
  );
}
