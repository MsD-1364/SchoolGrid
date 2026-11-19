import { Routes, Route, Navigate } from 'react-router-dom';

import GetWay from './GetWay/GetWay';
import AuthCallback from './GetWay/AuthCallback';
import ProtectedRoute from './GetWay/ProtectedRoute';
import PageNotFound from './GetWay/PageNotFound';

import SuperAdminDashBoard from './SuperAdmin/SuperAdminDashBoard/SuperAdminDashBoard';
import AdminDashboard from './SuperAdmin/SuperAdminDashBoard/AdminDashboard';
import SchoolDashBoard from './SchoolPanel/SchoolDashBoard/SchoolDashBoard';
import PlaceholderPage from './GlobalComponents/PlaceholderPage';
import { DASHBOARD_PATHS, ROLES } from './lib/auth/roles';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<GetWay />} />
      <Route path="/login" element={<GetWay />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Old /dashboard link keeps working */}
      <Route path="/dashboard" element={<Navigate to={DASHBOARD_PATHS.SUPER_ADMIN} replace />} />

      {/* Super admin: sidebar shell + pages rendered in its <Outlet /> */}
      <Route
        path={DASHBOARD_PATHS.SUPER_ADMIN}
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminDashBoard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<PlaceholderPage title="Students" />} />
        <Route path="teachers" element={<PlaceholderPage title="Teachers" />} />
        <Route path="classes" element={<PlaceholderPage title="Classes" />} />
        <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
        <Route path="grades" element={<PlaceholderPage title="Grades" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="*" element={<PageNotFound homeHref={DASHBOARD_PATHS.SUPER_ADMIN} loginHref="/login" />} />
      </Route>

      {/* School panel */}
      <Route
        path={DASHBOARD_PATHS.SCHOOL}
        element={
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL]}>
            <SchoolDashBoard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<PageNotFound homeHref="/login" loginHref="/login" />} />
    </Routes>
  );
}