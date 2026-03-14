import { Navigate, Outlet } from "react-router-dom";
import NotAuthorized from "../components/auth/not-authorized.jsx";
import { getAuthToken, getStoredUserRole } from "../lib/api";

export const ProtectedRoute = () => {
  return getAuthToken() ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export const AdminRoute = () => {
  return getStoredUserRole() === "admin" ? (
    <Outlet />
  ) : (
    <NotAuthorized roleNeeded="admin" />
  );
};
