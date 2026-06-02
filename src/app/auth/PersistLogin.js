import { Outlet, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import usePersist from "../hooks/usePersist";
import { selectCurrentToken } from "./authSlice";
import { useRefreshMutation } from "./authApiSlice";
import { extendedUserApiSlice } from "../features/api/userSlice";

let persistedRefreshPromise = null;

const PersistLogin = () => {
  const dispatch = useDispatch();
  const [persist] = usePersist();
  const token = useSelector(selectCurrentToken);
  const refreshAttemptedRef = useRef(false);
  const profileRequestedRef = useRef(false);
  const [trueSuccess, setTrueSuccess] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refresh, { isLoading, error }] = useRefreshMutation();

  useEffect(() => {
    if (!persist || token || refreshAttemptedRef.current) {
      return;
    }

    refreshAttemptedRef.current = true;

    const verifyRefreshToken = async () => {
      try {
        if (!persistedRefreshPromise) {
          persistedRefreshPromise = refresh().unwrap().finally(() => {
            persistedRefreshPromise = null;
          });
        }

        await persistedRefreshPromise;
        setTrueSuccess(true);
        setRefreshFailed(false);
      } catch (err) {
        console.log(err);
        setRefreshFailed(true);
      }
    };

    verifyRefreshToken();
  }, [persist, refresh, token]);

  useEffect(() => {
    if ((token || trueSuccess) && !profileRequestedRef.current) {
      profileRequestedRef.current = true;
      dispatch(extendedUserApiSlice.endpoints.getProfile.initiate());
    }
  }, [dispatch, token, trueSuccess]);

  if (!persist || token || trueSuccess) {
    return <Outlet />;
  }

  if (isLoading || !refreshFailed) {
    return <p>Loading...</p>;
  }

  return (
    <p>
      {error?.data?.message || "Your login has expired. "}
      <Link to="/">Please login again</Link>
    </p>
  );
};

export default PersistLogin;
