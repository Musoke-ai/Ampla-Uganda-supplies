// PermissionWrapper.jsx
import { selectRoles } from './authSlice';
import { useSelector } from 'react-redux';

const RoleWrapper = ({ required = [], children }) => {
  const roles = useSelector(selectRoles);
  const isAllowed = required?.some(role => roles?.includes(role));

  return isAllowed ? <>{children}</> : null;
};

export default RoleWrapper;
