import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense, useState } from 'react';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import SuperJSON from 'superjson';

import { Layout } from '@frontend/Layout';
import { NotFound } from '@frontend/views/NotFound';
import { Profile } from '@frontend/views/Profile';
import { Project } from '@frontend/views/Project/Project';
import { ProjectsPage } from '@frontend/views/Project/Projects';
import { ProjectObject } from '@frontend/views/ProjectObject/ProjectObject';
import { SapDebugView } from '@frontend/views/SapDebug';
import { Settings } from '@frontend/views/Settings';

import { trpc } from './client';
import { authAtom, getUserAtom } from './stores/auth';

const UserLoader = () => {
  const user = useAtomValue(getUserAtom);
  const setAuth = useSetAtom(authAtom);
  setAuth(user);
  return null;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<ProjectsPage />} />
      <Route path="hankkeet" element={<ProjectsPage />} />
      <Route path="hanke/luo" element={<Project />} />
      <Route path="hanke/:projectId" element={<Project />} />
      <Route path="hanke/:projectId/uusi-kohde" element={<ProjectObject />} />
      <Route path="hanke/:projectId/:tabView" element={<Project />} />
      <Route path="hanke/:projectId/kohde/:projectObjectId" element={<ProjectObject />} />
      <Route path="saptest/:sapProjectId" element={<SapDebugView />} />
      <Route path="profiili" element={<Profile />} />
      <Route path="asetukset" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export function App() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpLink({ url: '/trpc' })],
      transformer: SuperJSON,
    })
  );

  return (
    <Suspense fallback={<p>Ladataan...</p>}>
      <UserLoader />
      {useAtomValue(authAtom).userId && (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </trpc.Provider>
      )}
    </Suspense>
  );
}
