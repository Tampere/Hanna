import '@fontsource/roboto';
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
import { DetailplanProject } from '@frontend/views/DetailplanProject/DetailplanProject';
import { Management } from '@frontend/views/Management';
import { NotFound } from '@frontend/views/NotFound';
import { InvestmentProject } from '@frontend/views/Project/InvestmentProject';
import { ProjectsPage } from '@frontend/views/Project/Projects';
import { ProjectObject } from '@frontend/views/ProjectObject/ProjectObject';
import { SapDebugView } from '@frontend/views/SapDebug';

import { trpc } from './client';
import { authAtom, getUserAtom, sessionExpiredAtom } from './stores/auth';
import { useTranslations } from './stores/lang';
import { Manual } from './views/Manual/Manual';
import { SapReports } from './views/SapReports';
import { SessionRenewed } from './views/SessionRenewed';

const UserLoader = () => {
  const user = useAtomValue(getUserAtom);
  const setAuth = useSetAtom(authAtom);
  setAuth(user);
  return null;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="ohje" element={<Manual />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<ProjectsPage />} />
        <Route path="hankkeet" element={<ProjectsPage />} />
        <Route path="investointihanke/luo" element={<InvestmentProject />} />
        <Route path="investointihanke/:projectId" element={<InvestmentProject />} />
        <Route
          path="investointihanke/:projectId/uusi-kohde"
          element={<ProjectObject projectType="investointihanke" />}
        />
        <Route path="investointihanke/:projectId/:tabView" element={<InvestmentProject />} />
        <Route
          path="investointihanke/:projectId/kohde/:projectObjectId"
          element={<ProjectObject projectType="investointihanke" />}
        />
        <Route
          path="investointihanke/:projectId/kohde/:projectObjectId/:tabView"
          element={<ProjectObject projectType="investointihanke" />}
        />
        <Route path="asemakaavahanke/luo" element={<DetailplanProject />} />
        <Route path="asemakaavahanke/:projectId" element={<DetailplanProject />} />
        <Route
          path="asemakaavahanke/:projectId/uusi-kohde"
          element={<ProjectObject projectType="asemakaavahanke" />}
        />
        <Route path="asemakaavahanke/:projectId/:tabView" element={<DetailplanProject />} />
        <Route
          path="asemakaavahanke/:projectId/kohde/:projectObjectId"
          element={<ProjectObject projectType="asemakaavahanke" />}
        />
        <Route
          path="asemakaavahanke/:projectId/kohde/:projectObjectId/:tabView"
          element={<ProjectObject projectType="asemakaavahanke" />}
        />
        <Route path="sap-raportit/:tabView" element={<SapReports />} />
        <Route path="hallinta/:tabView" element={<Management />} />
        <Route path="saptest/:sapProjectId" element={<SapDebugView />} />
        <Route path="session-renewed" element={<SessionRenewed />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </>
  )
);

export function App() {
  const tr = useTranslations();
  const setSessionExpired = useSetAtom(sessionExpiredAtom);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: '/trpc',
          // Override fetch function to intercept all TRPC response status codes for detecting expired sessions
          async fetch(url, options) {
            const result = await fetch(url, { ...options });
            if (result.status === 401) {
              // Any 401 error in TRPC responses -> session has been expired
              setSessionExpired(true);
            } else {
              // Any non-401 status -> session is OK
              setSessionExpired(false);
            }
            return result;
          },
        }),
      ],
      transformer: SuperJSON,
    })
  );

  return (
    <Suspense fallback={<p>{tr('loading')}</p>}>
      <UserLoader />
      {useAtomValue(authAtom) && (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </trpc.Provider>
      )}
    </Suspense>
  );
}
