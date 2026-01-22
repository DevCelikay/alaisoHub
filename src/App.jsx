import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Prerequisites from './pages/Prerequisites';
import SOPIndex from './pages/SOPIndex';
import Prompts from './pages/Prompts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="prerequisites" element={<Prerequisites />} />
          <Route path="sops" element={<SOPIndex />} />
          <Route path="prompts" element={<Prompts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
