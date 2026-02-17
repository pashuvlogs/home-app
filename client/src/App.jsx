import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AssessmentLayout from './pages/assessment/AssessmentLayout';
import Part1ClientDetails from './pages/assessment/Part1ClientDetails';
import Part2HousingNeed from './pages/assessment/Part2HousingNeed';
import Part3TenancySuitability from './pages/assessment/Part3TenancySuitability';
import Part4HealthWellbeing from './pages/assessment/Part4HealthWellbeing';
import Part5SupportNetworks from './pages/assessment/Part5SupportNetworks';
import Part6AdditionalInfo from './pages/assessment/Part6AdditionalInfo';
import Part7Summary from './pages/assessment/Part7Summary';
import Part8Approval from './pages/assessment/Part8Approval';

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

function PartRouter() {
  const { part } = useParams();

  switch (part) {
    case '1': return <Part1ClientDetails />;
    case '2': return <Part2HousingNeed />;
    case '3': return <Part3TenancySuitability />;
    case '4': return <Part4HealthWellbeing />;
    case '5': return <Part5SupportNetworks />;
    case '6': return <Part6AdditionalInfo />;
    case '7': return <Part7Summary />;
    case '8': return <Part8Approval />;
    default: return <Navigate to="1" replace />;
  }
}
