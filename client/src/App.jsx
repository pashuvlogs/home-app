import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AssessmentLayout from './pages/assessment/AssessmentLayout';
import Part1ClientDetails from './pages/assessment/Part1ClientDetails';
import Part2HousingNeed from './pages/assessment/Part2HousingNeed';
import Part3TenancySuitability from './pages/assessment/Part3TenancySuitability';
import Part4Mitigation from './pages/assessment/Part4Mitigation';
import Part5Summary from './pages/assessment/Part5Summary';
import Part6Approval from './pages/assessment/Part6Approval';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="reports" element={
              <ProtectedRoute roles={['manager', 'senior_manager']}><Reports /></ProtectedRoute>
            } />
          </Route>

          <Route path="/assessment/:id" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          }>
            <Route element={<AssessmentLayout />}>
              <Route index element={<Navigate to="1" replace />} />
              <Route path=":part" element={<PartRouter />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function PartRouter() {
  const { part } = useParams();

  switch (part) {
    case '1': return <Part1ClientDetails />;
    case '2': return <Part2HousingNeed />;
    case '3': return <Part3TenancySuitability />;
    case '4': return <Part4Mitigation />;
    case '5': return <Part5Summary />;
    case '6': return <Part6Approval />;
    default: return <Navigate to="1" replace />;
  }
}
