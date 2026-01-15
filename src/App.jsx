// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/authcontexts';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import { Navigate } from 'react-router-dom';

// Pages
import Login from './Pages/login';
import Dashboard from './Pages/Dashboard';
import NewIssue from './Pages/NewIssue';
import IssueDetail from './Pages/IssueDetails';
import Resolved from './Pages/Resolved';
import InnovationRecords from './Pages/InnovationRecords';
import InnovationDetail from './Pages/InnovationDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<NewIssue />} />
            <Route path="/issues" element={<Dashboard />} />
            <Route path="/new" element={<NewIssue />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/resolved" element={<Resolved />} />
            <Route path="/innovation-records" element={<InnovationRecords />} />
            <Route path="/innovation-records/:id" element={<InnovationDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;