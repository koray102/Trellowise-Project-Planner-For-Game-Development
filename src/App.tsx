import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store';
import { Layout } from './components/Layout';
import { ProfileSelect } from './components/ProfileSelect';
import { Dashboard } from './pages/Dashboard';
import { Occupieds } from './pages/Occupieds';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';

function App() {
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    useStore.getState().initDb();
  }, []);

  // Show profile selection if no user is selected
  if (!currentUser) {
    return <ProfileSelect />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/occupieds" element={<Occupieds />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

