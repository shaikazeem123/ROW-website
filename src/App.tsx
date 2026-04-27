import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { SyncService } from './lib/syncService';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  useEffect(() => {
    // Attempt background sync on app launch
    SyncService.syncPendingRecords();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <SpeedInsights />
    </AuthProvider>
  );
}

export default App;
