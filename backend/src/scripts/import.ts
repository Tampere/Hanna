import { parse } from 'csv-parse/sync';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { projectUpsert } from '@backend/components/project/detailplan';
import { createDatabasePool, getPool, sql } from '@backend/db';

import { DetailplanProject } from '@shared/schema/project/detailplan';
import { User } from '@shared/schema/user';

dayjs.extend(customParseFormat);

type CsvKey =
  | '\uFEFFHankkeen nimi'
  | 'Kuvaus'
  | 'Kaavanumero'
  | 'Elinkaaritila'
  | 'Alkuajankohta'
  | 'Loppuajankohta'
  | 'SAP projekti id'
  | 'Omistaja'
  | 'diaarinumero'
  | 'Diaaripäivämäärä'
  | 'kaavahanketyyppi'
  | 'suunnittelualue'
  | 'Tila '
  | 'Valmistelija '
  | 'Tekninen suunnittelija'
  | 'Alue/ kaupunginosa'
  | 'Kortteli/ tontti'
  | 'Osoitteet'
  | 'Aloite pvm'
  | 'Hakijan nimi'
  | 'Hakijan osoite'
  | 'Lisätiedot'
  | 'Hakijan tavoitteet';

type CsvRow = { [key in CsvKey]: string };

function convertDateToIsoFormat(date: string) {
  return !date.length ? null : dayjs(date, 'D.M.YYYY').format('YYYY-MM-DD');
}

function convertLifecycleStateToId(state: string) {
  return (
    {
      Aloittamatta: '01',
      Käynnissä: '02',
      Valmis: '03',
      Odottaa: '04',
    }[state] ?? ''
  );
}

function convertNameToUserId(name: string) {
  return (
    {
      '<user name>': '<user id>',
    }[name] ?? ''
  );
}

function convertPlanningZoneToId(zone: string) {
  return {
    Länsi: '01',
    Keskusta: '02',
    Itä: '03',
    Etelä: '04',
  }[zone];
}

function convertSubtypeToId(subtype: string) {
  return {
    Asemakaava: '01',
    Asemakaavamuutos: '02',
    Yleissuunnitelma: '03',
  }[subtype];
}

function csvRowToDetailplanProject(row: CsvRow): DetailplanProject {
  return {
    projectName: row['﻿Hankkeen nimi'],
    startDate: convertDateToIsoFormat(row.Alkuajankohta)!,
    endDate: convertDateToIsoFormat(row.Loppuajankohta)!,
    addressText: row.Osoitteet,
    blockName: row['Kortteli/ tontti'],
    description: row.Kuvaus,
    district: row['Alue/ kaupunginosa'],
    lifecycleState: convertLifecycleStateToId(row.Elinkaaritila),
    owner: convertNameToUserId(row.Omistaja),
    preparer: convertNameToUserId(row['Valmistelija ']),
    sapProjectId: row['SAP projekti id'],
    applicantObjective: row['Hakijan tavoitteet'],
    detailplanId: row.Kaavanumero,
    diaryId: row.diaarinumero,
    additionalInfo: row.Lisätiedot,
    applicantAddress: row['Hakijan osoite'],
    applicantName: row['Hakijan nimi'],
    diaryDate: convertDateToIsoFormat(row.Diaaripäivämäärä),
    initiativeDate: convertDateToIsoFormat(row['Aloite pvm']),
    planningZone: convertPlanningZoneToId(row.suunnittelualue),
    technicalPlanner: convertNameToUserId(row['Tekninen suunnittelija']),
    subtype: convertSubtypeToId(row.kaavahanketyyppi),
  };
}

async function run() {
  await createDatabasePool();

  const rawCsv = readFileSync(resolve(__dirname, 'data.csv')).toString();
  const data = parse(rawCsv, { columns: true, skip_empty_lines: true }) as CsvRow[];
  const user: User = {
    id: '<user id>',
    email: '',
    name: '',
  };

  const projects = await Promise.all(
    data.map((row) => csvRowToDetailplanProject(row)).map((project) => projectUpsert(project, user))
  );

  console.log(projects);

  console.log(`Imported ${projects.length} projects`);
}

run();
