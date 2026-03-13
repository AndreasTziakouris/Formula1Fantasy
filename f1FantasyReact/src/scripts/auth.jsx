import { Outlet } from "react-router-dom";
import NotAuthorized from "../components/auth/not-authorized.jsx";

export const ProtectedRoute = () => {
  const isLoggedIn =
    typeof window !== "undefined" && window.localStorage.getItem("token");
  return isLoggedIn ? <Outlet /> : <NotAuthorized roleNeeded="user" />;
};

export const AdminRoute = () => {
  const role =
    typeof window !== "undefined" && window.localStorage.getItem("userRole");
  return role === "admin" ? <Outlet /> : <NotAuthorized roleNeeded="admin" />;
};
