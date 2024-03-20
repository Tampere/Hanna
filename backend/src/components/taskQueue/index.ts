import PgBoss from 'pg-boss';
import { z } from 'zod';

import { connectionDsn, getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

let boss: PgBoss | null = null;

const finishedStates: PgBoss.JobWithMetadata['state'][] = [
  'completed',
  'expired',
  'failed',
  'cancelled',
];

function assertTaskQueueInitialized(boss: PgBoss | null): asserts boss is PgBoss {
  if (!boss) {
    throw new Error('Task queue not initialized!');
  }
}

export async function initializeTaskQueue() {
  boss = new PgBoss(connectionDsn);
  boss.on('error', (error) => logger.error(`Error in task queue: ${JSON.stringify(error)}`));

  await boss.start();
}

export function getTaskQueue() {
  assertTaskQueueInitialized(boss);
  return boss;
}

export async function getJob<Output extends object | void = void>(jobId: string) {
  assertTaskQueueInitialized(boss);

  const job = await boss.getJobById(jobId);

  if (!job) {
    throw new Error(`Job with ID ${jobId} was not found`);
  }
  return {
    state: job.state,
    output: job.output as Output,
    isFinished: finishedStates.includes(job.state),
  };
}

export async function startJob<T extends object>(queueName: string, data: T) {
  const jobId = await getTaskQueue().send(queueName, data);
  if (!jobId) {
    throw new Error(`Error assigning job ID in queue "${queueName}"`);
  }
  logger.warn('Job started with ID: ' + jobId);
  return jobId;
}

export async function getPendingJobs(queueName?: string) {
  const result = await getPool().any(sql.type(z.object({ id: z.string() }))`
    SELECT id
    FROM pgboss.job
    WHERE state IN ('active', 'created')
    ${queueName != null ? sql.fragment`AND name = ${queueName}` : sql.fragment``}
  `);
  return result.map((result) => result.id);
}
