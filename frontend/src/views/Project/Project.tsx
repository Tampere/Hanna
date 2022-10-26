import { css } from '@emotion/react';
import { AddCircle, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  FormLabel,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

import { client } from '@frontend/client';
import { DateRange } from '@frontend/components/DateRange';

// Component styles

const pageStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
`;

const infobarRootStyle = css`
  padding: 16px;
`;

const projectDataContainerStyle = css`
  padding: 16px;
  display: grid;
`;

const mapContainerStyle = css`
  padding: 16px;
`;

const accordionSummaryStyle = css`
  background: #eee;
  border: 1px solid #ccc;
`;

export function Project() {
  return (
    <div css={pageStyle}>
      <Paper elevation={2} css={infobarRootStyle}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Uusi hanke
        </Typography>
        <Accordion expanded={true}>
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">Perustiedot</Typography>
          </AccordionSummary>
          <AccordionDetails css={projectDataContainerStyle}>
            <FormControl margin="dense">
              <FormLabel>Hankkeen nimi</FormLabel>
              <TextField size="small" fullWidth={true} placeholder="Nimi" />
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Hanketyyppi</FormLabel>
              <Select size="small" fullWidth={true}></Select>
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Elinkaaren tila</FormLabel>
              <Select size="small" fullWidth={true}></Select>
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Rahoitusmalli</FormLabel>
              <Select size="small" fullWidth={true}></Select>
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Lautakunta</FormLabel>
              <Select size="small" fullWidth={true}></Select>
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Omistaja</FormLabel>
              <Select size="small" fullWidth={true}></Select>
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Toteutusaika</FormLabel>
              <DateRange />
            </FormControl>
            <FormControl margin="dense">
              <FormLabel>Kuvaus</FormLabel>
              <TextField minRows={3} maxRows={6} multiline={true} />
            </FormControl>

            <Box>
              <Button
                sx={{ mt: 2 }}
                disabled={true}
                variant="contained"
                color="primary"
                size="small"
                endIcon={<AddCircle />}
                onClick={() => {
                  client.project.create.mutate({ description: 'TODO', name: 'TODO' });
                }}
              >
                Luo uusi hanke
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">Liitokset</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">Asiakirjat</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">Päätökset</Typography>
          </AccordionSummary>
        </Accordion>
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        Kartta
      </Paper>
    </div>
  );
}
