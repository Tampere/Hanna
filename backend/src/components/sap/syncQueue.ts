import { z } from 'zod';

import {
  getCompanyProjectList,
  getSapActuals,
  getSapProject,
} from '@backend/components/sap/dataImport';
import { getPool, sql } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';

import { arrayChunks } from '@shared/utils';

import { getPendingJobs, getTaskQueue } from '../taskQueue';

const queueName = 'sap-sync';
const scheduleQueueName = 'scheduled-sap-sync';
const scheduleCron = `0 ${env.sapSync.cronStartHour} * * *`;

interface SyncJobData {
  projectId: string;
  parentJob: string;
}

export async function unscheduleSync() {
  await getTaskQueue().unschedule(scheduleQueueName);
  logger.info('Unscheduled SAP sync');
}

export async function scheduleSync() {
  await getTaskQueue().schedule(scheduleQueueName, scheduleCron);
  logger.info(`Scheduled SAP sync with cron ${scheduleCron}`);
}

export async function manuallyStartSync() {
  getTaskQueue().send({ name: scheduleQueueName });
  logger.info('Triggered SAP sync manually');
}

export async function cancelPendingSyncJobs() {
  logger.info('Cancelling pending SAP sync jobs...');
  const pendingJobIds = await getPendingJobs(queueName);
  if (pendingJobIds.length > 0) {
    await getTaskQueue().cancel(pendingJobIds);
    logger.info(`Cancelled ${pendingJobIds.length} pending SAP sync jobs`);
  } else {
    logger.info(`No pending SAP sync jobs found to be cancelled`);
  }
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
        if (project?.plannedStartDate) {
          const actuals = await getSapActuals(
            data.projectId,
            new Date(project.plannedStartDate).getFullYear(),
            new Date().getFullYear()
          );
          logger.info(`Loaded ${actuals.length} actuals for project ${data.projectId}`);
        } else {
          logger.info(
            `No planned start date found for project ${data.projectId}, skipping actuals fetch`
          );
        }
      } catch (err) {
        logger.error(`Error syncing SAP project ${data.projectId}`);
        console.error(err);
        throw err;
      }
    }
  );
}

export async function setupScheduledSyncQueue() {
  const taskQueue = getTaskQueue();
  taskQueue.work<void>(
    scheduleQueueName,
    {
      teamConcurrency: 1,
    },
    async function ({ id }) {
      logger.info('Starting scheduled SAP sync...');
      const companies = env.sapSync.companies;
      logger.info(`Sync enabled for companies: ${companies}`);

      companies.map(async (company) => {
        const projects = await getCompanyProjectList(company);
        logger.info(`Got ${projects.length} projects for company ${company}...`);
        const projectIds = projects.map((project) => project.PSPID);
        const idChunks = arrayChunks(projectIds, 50);

        idChunks.forEach(async (chunk) => {
          await taskQueue.insert(
            chunk.map((projectId) => ({
              name: queueName,
              data: { projectId, parentJob: id },
            }))
          );
        });
      });
    }
  );

  // Set the cron schedule on setup
  await scheduleSync();
}

const summaryFragment = sql.fragment`
  SELECT
    job.id "id",
    job.startedon "startedAt",
    max(child.completedon)::timestamp "lastJobCompletedAt",
    count(*) "totalProjects",
    count(*) filter (where child.state = 'created') created,
    count(*) filter (where child.state = 'cancelled') cancelled,
    count(*) filter (where child.state = 'active') active,
    count(*) filter (where child.state = 'failed') failed,
    count(*) filter (where child.state = 'expired') expired,
    count(*) filter (where child.state = 'completed') completed
  FROM pgboss.job job
  LEFT JOIN pgboss.job child ON child.data->>'parentJob' = job.id::text
  WHERE job.name = 'scheduled-sap-sync'
  GROUP BY job.id
  ORDER BY job.createdon DESC
`;

export async function getLastSyncedAt() {
  const { lastJobCompletedAt } = await getPool().one(sql.type(
    z.object({ lastJobCompletedAt: z.date() })
  )`
    WITH summary AS (
      ${summaryFragment}
    )
    SELECT "lastJobCompletedAt" FROM summary
    WHERE created = 0 AND active = 0
    LIMIT 1
  `);

  return lastJobCompletedAt;
}

export async function getSyncSummary(limit?: number) {
  return await getPool().any(sql.untyped`
    ${summaryFragment}
    ${limit != null ? sql.fragment`LIMIT ${limit}` : sql.fragment``}
  `);
}
