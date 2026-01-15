// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authcontexts';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import { useAuth } from './context/authcontexts';

import Login from './Pages/login';
import Dashboard from './Pages/Dashboard';
import NewIssue from './Pages/NewIssue';
import IssueDetail from './Pages/IssueDetails';
import Resolved from './Pages/Resolved';
import InnovationRecords from './Pages/InnovationRecords';
import InnovationDetail from './Pages/InnovationDetail';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<NewIssue />} />
        <Route path="/issues" element={<Dashboard />} />
        <Route path="/new" element={<NewIssue />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/resolved" element={<Resolved />} />
        <Route path="/innovation-records" element={<InnovationRecords />} />
        <Route path="/innovation-records/:id" element={<InnovationDetail />} />
      </Route>
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;