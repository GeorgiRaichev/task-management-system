import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import NotificationsPage from "../pages/NotificationsPage";
import ProjectsPage from "../pages/ProjectsPage";
import RegisterPage from "../pages/RegisterPage";
import UsersPage from "../pages/UsersPage";
import ProtectedRoute from "./ProtectedRoute";
import GroupsPage from "../pages/GroupsPage";

import { UserRole } from "../features/auth/types";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR]} />}
      >
        <Route element={<MainLayout />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
