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
  const dbReady = useStore((s) => s.dbReady);

  useEffect(() => {
    useStore.getState().initDb();
  }, []);

  // Show loading while Supabase data is being fetched
  if (!dbReady) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

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

