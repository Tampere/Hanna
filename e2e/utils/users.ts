import { client } from './trpc';

export async function clearUserPermissions(...userIds: string[]) {
  client.userPermissions.setPermissions.mutate(
    userIds.map((id) => ({ userId: id, permissions: [] }))
  );
}

export const ADMIN_USER = 'admin@localhost';
export const DEV_USER = 'dev@localhost';
export const TEST_USER = 'test@localhost';
