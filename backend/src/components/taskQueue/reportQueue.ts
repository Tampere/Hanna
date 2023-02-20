import { buildProjectReport } from '@backend/components/report/projectReport';

import { ProjectSearch } from '@shared/schema/project';

import { getJob, getTaskQueue } from '.';

const queueName = 'report';

async function generateReport({ id, data }: { id: string; data: ProjectSearch }) {
  await buildProjectReport(id, data);
}

export async function initializeReportQueue() {
  const queue = getTaskQueue();
  queue.work<ProjectSearch, void>(queueName, generateReport);
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
  return getJob(jobId);
}
