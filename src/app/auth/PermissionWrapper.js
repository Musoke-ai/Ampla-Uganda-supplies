// PermissionWrapper.jsx
import { useSelector } from 'react-redux';
import { selectPermissions, selectRoles } from './authSlice';

const OWNER_ACCESS = new Set(["admin", "superadmin", "developer"]);

const PermissionWrapper = ( { required = [], children }) => {

  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  const normalizedPermissions = Array.isArray(permissions)
    ? permissions.map((permission) => String(permission).toLowerCase())
    : [];
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => String(role).toLowerCase())
    : [];
  
  const hasOwnerAccess =
    normalizedPermissions.some((permission) => OWNER_ACCESS.has(permission)) ||
    normalizedRoles.some((role) => OWNER_ACCESS.has(role));
  const hasRequiredPermissions = required?.every((permission) =>
    normalizedPermissions.includes(String(permission).toLowerCase())
  );
  const isAllowed = hasOwnerAccess || hasRequiredPermissions;

  return isAllowed ? <>{children}</> : null;
};

export default PermissionWrapper;
