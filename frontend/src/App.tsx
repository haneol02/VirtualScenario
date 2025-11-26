import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SceneEditor from './pages/SceneEditor';
import BackgroundMapEditor from './pages/BackgroundMapEditor';
import Simulator from './pages/Simulator';
import Titlebar from './components/Titlebar';

function App() {
  return (
    <div className="app-shell with-titlebar">
      <Titlebar />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:projectId" element={<SceneEditor />} />
          <Route path="/background-maps" element={<BackgroundMapEditor />} />
          <Route path="/simulator/:projectId" element={<Simulator />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
