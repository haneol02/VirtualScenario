import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SceneEditor from './pages/SceneEditor';
import BackgroundMapEditor from './pages/BackgroundMapEditor';
import Simulator from './pages/Simulator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:projectId" element={<SceneEditor />} />
        <Route path="/background-maps" element={<BackgroundMapEditor />} />
        <Route path="/simulator/:projectId" element={<Simulator />} />
      </Routes>
    </Router>
  );
}

export default App;
