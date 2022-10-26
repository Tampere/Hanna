import { useAtomValue, useSetAtom } from 'jotai';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@frontend/Layout';
import { NotFound } from '@frontend/views/NotFound';
import { Profile } from '@frontend/views/Profile';
import { Project } from '@frontend/views/Project/Project';
import { Projects } from '@frontend/views/Project/Projects';
import { Settings } from '@frontend/views/Settings';

import { authAtom, getUserAtom } from './stores/auth';

const UserLoader = () => {
  const user = useAtomValue(getUserAtom);
  const setAuth = useSetAtom(authAtom);
  setAuth(user);
  return null;
};

export function App() {
  return (
    <Suspense fallback={<p>Ladataan...</p>}>
      <UserLoader />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Projects />} />
            <Route path="hanke" element={<Projects />} />
            <Route path="hanke/luo" element={<Project />} />
            <Route path="profiili" element={<Profile />} />
            <Route path="asetukset" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}
