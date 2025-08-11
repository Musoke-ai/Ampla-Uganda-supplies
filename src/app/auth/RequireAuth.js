import useAuth from "../hooks/useAuth";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { selectCurrentToken, selectRoles } from "./authSlice";

import { useDispatch } from "react-redux";
import { useRefreshMutation } from "./authApiSlice";

const RequireAuth = ({ allowedRoles }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  const accessToken = useSelector(selectCurrentToken);
  const roles =  useSelector(selectRoles)??[];

  const [isAuth, setIsAuth] = useState(accessToken ? true : false);

  const handleRefresh = async () => {
    try {
      const data = await dispatch(refresh).unwrap();
      setIsAuth(data?.data ? true : false);
    } catch (error) {
      console.log("Error: " + error);
    }
    dispatch(refresh);
  };

  useEffect(() => {
    handleRefresh();
  }, [location]);

  const hasAccess = roles?.some(role => allowedRoles?.includes(role));

if (hasAccess) {
  return <Outlet />;
}

return (
  <Navigate
    to={isAuth ? "/accessDenied" : "/"}
    state={{ from: location }}
    replace
  />
);

//   return roles?.find(role => allowedRoles?.includes(role)) ? (
//     <Outlet />
//   ) : ( isAuth? <Navigate to="/accessDenied" state={{ from: location }} replace />
//     :<Navigate to="/" state={{ from: location }} replace />
//   );
  //    if(isAuth){
  //     return <Outlet />
  //    }else {
  //     navigate('/')  
  //    }
};

export default RequireAuth;
