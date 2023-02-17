import { ProjectSearch } from 'tre-hanna-shared/src/schema/project';

import { sleep } from '@shared/utils';

import { getJob, getTaskQueue } from '.';

const queueName = 'report';

interface Output {
  bar: number;
}

async function generateReport({ data }: { data: ProjectSearch }) {
  await sleep(10000);
  return { bar: 123 };
}

export async function initializeReportQueue() {
  const queue = getTaskQueue();
  queue.work<ProjectSearch, Output>(queueName, generateReport);
}

export async function startReportJob(data: ProjectSearch) {
  const queue = getTaskQueue();
  const jobId = await queue.send(queueName, data);
  if (!jobId) {
    throw new Error(`Error assigning job ID for report job`);
  }
  return jobId;
}

export async function getReportJob(jobId: string) {
  return getJob<Output>(jobId);
}
