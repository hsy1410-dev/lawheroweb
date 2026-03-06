import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function AuthGuard({ children }) {

  const { user, authReady } = useAuth();

  if (!authReady) {
    return null; // auth 체크 중
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children ? children : <Outlet />;
}