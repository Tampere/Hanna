import { Box } from '@mui/material';

import { trpc } from '@frontend/client';

export function UserPermissionsPage() {
  const userPermissions = trpc.userPermissions.getAll.useQuery();

  return (
    <Box>
      <h1>UserPermissionsPage</h1>

      <pre>{JSON.stringify(userPermissions.data, null, 2)}</pre>
    </Box>
  );
}
