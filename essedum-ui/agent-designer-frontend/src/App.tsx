import { HashRouter, Routes, Route } from 'react-router-dom';
import Designer from './pages/Designer';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Designer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
