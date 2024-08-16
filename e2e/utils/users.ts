import { login } from './page.js';

export async function clearUserPermissions(client: UserSessionObject['client'], userIds: string[]) {
  return client.userPermissions.setPermissions.mutate(
    userIds.map((id) => ({ userId: id, permissions: [] })),
  );
}

export type UserSessionObject = {
  client: Awaited<ReturnType<typeof login>>['client'];
  page: Awaited<ReturnType<typeof login>>['page'];
};

export const ADMIN_USER = 'admin@localhost';
export const DEV_ADMIN_USER = 'dev_admin@localhost';
export const DEV_USER = 'dev@localhost';
export const TEST_USER = 'test@localhost';
export const TEST_USER_2 = 'test2@localhost';
