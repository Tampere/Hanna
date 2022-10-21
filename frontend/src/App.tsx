import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@frontend/Layout';
import { NotFound } from '@frontend/views/NotFound';
import { Profile } from '@frontend/views/Profile';
import { Projects } from '@frontend/views/Projects';
import { Search } from '@frontend/views/Search';
import { Settings } from '@frontend/views/Settings';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Projects />} />
          <Route path="projects" element={<Projects />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
