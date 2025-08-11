import { selectCurrentToken } from "../auth/authSlice";
import { useSelector } from "react-redux";


const useAuth = () => {

  let user = useSelector(selectCurrentToken);
  console.log("Token: " + user)
  let isAuthenticated = false;
  
  user ? isAuthenticated = true : isAuthenticated = false;
  return isAuthenticated;
}

export default useAuth;
