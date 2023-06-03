import { arrayChunks } from 'tre-hanna-shared/src/utils';

import {
  getCompanyProjectList,
  getSapActuals,
  getSapProject,
} from '@backend/components/sap/dataImport';
import { env } from '@backend/env';
import { logger } from '@backend/logging';

import { getTaskQueue, startJob } from '../taskQueue';

const queueName = 'sap-sync';

interface SyncJobData {
  projectId: string;
}

export async function setupSapSyncQueue() {
  getTaskQueue().work<SyncJobData>(
    queueName,
    {
      teamSize: env.sapSync.queueTeamSize,
      teamConcurrency: env.sapSync.queueTeamConcurrency,
    },
    async function ({ data }) {
      try {
        logger.info(`Starting SAP sync for project ${data.projectId}...`);
        const project = await getSapProject(data.projectId);
        logger.info(`Loaded SAP project ${project?.sapProjectId}, fetching actuals...`);
        // TODO: does project contain sensible date range for actuals that could be used here?
        // another todo item is in the dataImport.ts file to make it possible to get actuals for range
        // in one request
        const actuals = await getSapActuals(data.projectId, '2022');
        logger.info(`Loaded ${actuals.length} actuals for project ${data.projectId}`);
      } catch (err) {
        logger.error(`Error syncing SAP project ${data.projectId}`);
        throw err;
      }
    }
  );
}

export async function startSapSync(data: SyncJobData) {
  return startJob(queueName, data);
}

// TODO: add cron schedule for daily sync
export async function startDailySync() {
  logger.info('Starting daily SAP sync...');
  const taskQueue = getTaskQueue();
  const companies = env.sapSync.companies;
  logger.info(`Sync enabled for companies: ${companies}`);

  companies.forEach(async (company) => {
    const projects = await getCompanyProjectList(company);
    logger.info(`Got ${projects.length} projects for company ${company}...`);
    const projectIds = projects.map((project) => project.PSPID);
    const idChunks = arrayChunks(projectIds, 50);

    idChunks.forEach((chunk) => {
      taskQueue.insert(
        chunk.map((projectId) => ({
          name: queueName,
          data: { projectId },
        }))
      );
    });
  });
}

// TODO: kill switch for sync
// TODO: Admin APIs for the synchronization state
// * Summary statistics
//  - Total number of projects to sync
//  - Number of pending projects to sync
//  - Number of completed syncs
//  - Number of failed syncs
//  - Execution time statistics
//    * can be calculated from pgboss data
// * manual stop / start for syncing (see api docs for graceful shutdown)
