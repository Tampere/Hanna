import '@fontsource/roboto';
import '@fontsource/roboto/500.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense, useState } from 'react';
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import SuperJSON from 'superjson';

import { Layout } from '@frontend/Layout';
import { trpc } from '@frontend/client';
import { asyncUserAtom, sessionExpiredAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { DetailplanProject } from '@frontend/views/DetailplanProject/DetailplanProject';
import { MaintenanceProject } from '@frontend/views/MaintenanceProject/MaintenanceProject';
import { Management } from '@frontend/views/Management';
import { Manual } from '@frontend/views/Manual/Manual';
import { NotFound } from '@frontend/views/NotFound';
import { InvestmentProject } from '@frontend/views/Project/InvestmentProject';
import { ProjectObject } from '@frontend/views/ProjectObject/ProjectObject';
import { SapDebugView } from '@frontend/views/SapDebug';
import { SapReports } from '@frontend/views/SapReports';
import { SearchPage } from '@frontend/views/Search';
import { SessionRenewed } from '@frontend/views/SessionRenewed';
import WorkTable from '@frontend/views/WorkTable/WorkTable';

import { selectedSearchViewAtom } from './stores/search/searchView';
import { GeneralNotifications } from './views/GeneralNotifications';

function IndexPath() {
  const selectedSearchView = useAtomValue(selectedSearchViewAtom);

  if (selectedSearchView === 'kohteet') {
    return <Navigate to="/kartta/kohteet" />;
  }

  return <Navigate to="/kartta/hankkeet" />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="ohje" element={<Manual />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPath />} />
        <Route path="kartta/:tabView" element={<SearchPage />} />
        <Route path="investointihanke/luo" element={<InvestmentProject />} />
        <Route path="investointihanke/:projectId" element={<InvestmentProject />} />
        <Route
          path="investointihanke/:projectId/uusi-kohde"
          element={<ProjectObject projectType="investointihanke" />}
        />
        <Route
          path="investointihanke/:projectId/kohde/:projectObjectId"
          element={<ProjectObject projectType="investointihanke" />}
        />
        <Route path="kohde/uusi" element={<ProjectObject projectType="investointihanke" />} />
        <Route path="kunnossapitohanke/luo" element={<MaintenanceProject />} />
        <Route path="kunnossapitohanke/:projectId" element={<MaintenanceProject />} />
        <Route
          path="kunnossapitohanke/:projectId/uusi-kohde"
          element={<ProjectObject projectType="kunnossapitohanke" />}
        />
        <Route
          path="kunnossapitohanke/:projectId/kohde/:projectObjectId"
          element={<ProjectObject projectType="kunnossapitohanke" />}
        />
        <Route path="asemakaavahanke/luo" element={<DetailplanProject />} />
        <Route path="asemakaavahanke/:projectId" element={<DetailplanProject />} />

        {import.meta.env.VITE_FEATURE_SAP_REPORTS === 'true' && (
          <Route path="sap-raportit/:tabView" element={<SapReports />} />
        )}
        <Route path="investointiohjelma" element={<WorkTable />} />
        <Route path="hallinta/:tabView" element={<Management />} />
        <Route path="hallinta/:tabView/:contentId" element={<Management />} />
        <Route path="hallinta/:tabView/luo" element={<Management />} />
        <Route path="tiedotteet" element={<GeneralNotifications />} />
        <Route path="saptest/:sapProjectId" element={<SapDebugView />} />
        <Route path="session-renewed" element={<SessionRenewed />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </>,
  ),
);

export function App() {
  const tr = useTranslations();
  const [sessionExpired, setSessionExpired] = useAtom(sessionExpiredAtom);
  const userValue = useAtomValue(asyncUserAtom);

  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
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
              if (!sessionExpired) {
                setSessionExpired(true);
              }
            } else {
              // Any non-401 status -> session is OK
              if (sessionExpired) {
                setSessionExpired(false);
              }
            }
            return result;
          },
        }),
      ],
      transformer: SuperJSON,
    }),
  );

  return (
    <Suspense fallback={<p>{tr('loading')}</p>}>
      {userValue && (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </trpc.Provider>
      )}
    </Suspense>
  );
}
