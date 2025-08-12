// PermissionWrapper.jsx
import { useSelector } from 'react-redux';
import { selectPermissions } from './authSlice';

const PermissionWrapper = ( { required = [], children }) => {

  const permissions = useSelector(selectPermissions);
  
  // The user is allowed if they have the 'admin' permission OR if they meet all required permissions.
  const isAllowed = permissions?.includes('admin') || required?.every(permission => permissions?.includes(permission));

  return isAllowed ? <>{children}</> : null;
};

export default PermissionWrapper;