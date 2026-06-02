import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken, selectRoles } from "./authSlice";

const RequireAuth = ({ allowedRoles }) => {
  const location = useLocation();
  const accessToken = useSelector(selectCurrentToken);
  const roles = useSelector(selectRoles) ?? [];
  const hasAccess = roles.some((role) => allowedRoles?.includes(role));

  if (!accessToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/accessDenied" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
