import { z } from 'zod';

import { getJob } from '@backend/components/taskQueue/index.js';

import { TRPC } from './index.js';

export const createJobRouter = (t: TRPC) =>
  t.router({
    getStatus: t.procedure.input(z.object({ jobId: z.string() })).query(async ({ input }) => {
      const { state, isFinished } = await getJob(input.jobId);
      return { state, isFinished };
    }),
  });
