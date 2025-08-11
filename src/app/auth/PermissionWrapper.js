// PermissionWrapper.jsx
import { useSelector } from 'react-redux';
import { selectPermissions } from './authSlice';

const PermissionWrapper = ( { required = [], children }) => {

  const permissions = useSelector(selectPermissions);
  const isAllowed = required?.every(permission => permissions?.includes(permission));

  return isAllowed ? <>{children}</> : null;
};

export default PermissionWrapper;
