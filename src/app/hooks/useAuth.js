import { selectCurrentToken } from "../auth/authSlice";
import { useSelector } from "react-redux";

const useAuth = () => {
    const user = useSelector(selectCurrentToken);
    let isAuthenticated = false;
    user?isAuthenticated=true:isAuthenticated=false;
  return isAuthenticated;
}

export default useAuth;
