import { updateDetailplanGeometries } from '@backend/components/detailplan-geom/geodata';
import { getTaskQueue } from '@backend/components/taskQueue';
import { logger } from '@backend/logging';

const QUEUE_NAME = 'detail-plan-geom-sync';
const CRON_DAILY_AT_0005 = '5 0 * * *';

async function scheduleSync() {
  // every day at 01:00
  await getTaskQueue().schedule(QUEUE_NAME, CRON_DAILY_AT_0005);
  logger.info(`Scheduled ${QUEUE_NAME} to ${CRON_DAILY_AT_0005}`);
}

export async function setupDetailPlanGeomSyncQueue() {
  getTaskQueue().work<void>(
    QUEUE_NAME,
    {
      teamSize: 1,
      teamConcurrency: 1,
    },
    async () => {
      await updateDetailplanGeometries();
    }
  );
  await scheduleSync();
}
