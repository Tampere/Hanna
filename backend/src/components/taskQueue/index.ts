import PgBoss from 'pg-boss';

import { connectionDsn } from '@backend/db';
import { logger } from '@backend/logging';

let boss: PgBoss | null = null;

const finishedStates: PgBoss.JobWithMetadata['state'][] = ['completed', 'expired', 'failed'];

function assertTaskQueueInitialized(boss: PgBoss | null): asserts boss is PgBoss {
  if (!boss) {
    throw new Error('Task queue not initialized!');
  }
}

export async function initializeTaskQueue() {
  boss = new PgBoss(connectionDsn);
  boss.on('error', (error) => logger.error(`Error in task queue: ${error}`));

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
