import { buildReport } from '@backend/components/report/index.js';
import { env } from '@backend/env.js';

import { ProjectSearch } from '@shared/schema/project/index.js';

import { getTaskQueue, startJob } from './index.js';

const queueName = 'report';

export async function setupReportQueue() {
  getTaskQueue().work<ProjectSearch>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      await buildReport(id, data);
    },
  );
}

export async function startReportJob(data: ProjectSearch) {
  return startJob(queueName, data);
}
