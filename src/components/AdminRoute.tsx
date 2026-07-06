import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectAuthUser,
  selectIsAdmin,
  selectSessionChecked,
} from "@/store/authSlice";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Renders children only if the current user is admin. Otherwise redirects to /personal-tasks.
 * Use with ProtectedRoute so that only logged-in admins can access admin pages.
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useSelector(selectAuthUser);
  const isAdmin = useSelector(selectIsAdmin);
  const sessionChecked = useSelector(selectSessionChecked);

  if (!sessionChecked || !user) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/personal-tasks" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
