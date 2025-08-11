import { Outlet, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import usePersist from "../hooks/usePersist";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "./authSlice";
import { useRefreshMutation } from "./authApiSlice";

import { store } from '../store'
import { extendedUserApiSlice } from "../features/api/userSlice";

const PersistLogin = () => {

    const [persist] = usePersist();
    const token = useSelector(selectCurrentToken);
    const effectRan = useRef(false);

    const [trueSuccess, setTrueSuccess] = useState(false);

    const [refresh, {
        isInitialized,
        isLoading,
        isSuccess,
        isError,
        error
    }] = useRefreshMutation();

    useEffect(() => {
        if (effectRan.current === true || process.env.NODE_ENV !== 'development') {

            const verifyRefreshToken = async () => {
                // console.log('Verifying refresh token');
                try {

                    await refresh()
                    setTrueSuccess(true)

                } catch (err) {
                    console.log(err);
                }
            }

            if (!token && persist) verifyRefreshToken()

        }

        return () => effectRan.current = true

    }, [])

    let content
    if (!persist) {
        content = <Outlet />
    } else if (isLoading) {
        content = <p>Loading...</p>
    } else if (isError) {
        console.log('error')
        content = (
            <p>
                {error?.data?.message}
                <Link to='/'>Please login again</Link>
            </p>
        )
    } else if (isSuccess && trueSuccess) {
        //refetch profile data on refresh
        store.dispatch(extendedUserApiSlice.endpoints.getProfile.initiate());
        content = <Outlet />
    } else if (token) {
        content = <Outlet />
    }

    return content
}

export default PersistLogin
