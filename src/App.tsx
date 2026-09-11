import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';

import { LoginPage } from './pages/LoginPage.js';
import { OfficerDashboard } from './pages/OfficerDashboard.js';
import { CorporateDashboard } from './pages/CorporateDashboard.js';
import { MinesPage } from './pages/MinesPage.js';
import { MineDetailPage } from './pages/MineDetailPage.js';
import { InspectionsPage } from './pages/InspectionsPage.js';
import { InspectionDetailPage } from './pages/InspectionDetailPage.js';
import { ViolationsPage } from './pages/ViolationsPage.js';
import { CompliancePage } from './pages/CompliancePage.js';
import { ContractorsPage } from './pages/ContractorsPage.js';
import { AlertsPage } from './pages/AlertsPage.js';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="text-xs font-mono">Authenticating with Statutory Coal Governance Registry...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                user.role === 'MINE_OFFICER' ? (
                  <Navigate to="/officer/dashboard" replace />
                ) : (
                  <Navigate to="/corporate/dashboard" replace />
                )
              }
            />
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/corporate/dashboard" element={<CorporateDashboard />} />
            <Route path="/mines" element={<MinesPage />} />
            <Route path="/mines/:id" element={<MineDetailPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/inspections/:id" element={<InspectionDetailPage />} />
            <Route path="/violations" element={<ViolationsPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/contractors" element={<ContractorsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
