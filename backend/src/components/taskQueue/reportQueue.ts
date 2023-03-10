import { buildProjectReport } from '@backend/components/report/projectReport';
import { env } from '@backend/env';

import { ProjectSearch } from '@shared/schema/project';

import { getTaskQueue, startJob } from '.';

const queueName = 'report';

export async function setupReportQueue() {
  getTaskQueue().work<ProjectSearch, void>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      await buildProjectReport(id, data);
    }
  );
}

export async function startReportJob(data: ProjectSearch) {
  return startJob(queueName, data);
}
