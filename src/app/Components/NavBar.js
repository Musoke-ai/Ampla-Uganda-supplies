import { useEffect } from 'react';
import { Calendar } from "react-bootstrap-icons";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PUSHER_DISCONNECT } from '../features/api/pusherMiddleware';

// --- Redux Imports ---
// Assuming these are correctly set up in your project
import { setCredentials, selectProfile, logOut } from "../auth/authSlice";
import { useSendLogoutMutation } from '../auth/authApiSlice';

// --- Component Imports ---
import UserAvatar from "./production/UserProfile";
import { useSettings } from "./Settings";
import ConnectionStatus from './alerts/ConnectionStatus';


// =================================================================================
// Main NavBar Component (Simplified)
// =================================================================================
const NavBar = () => {
    const { settings } = useSettings();
    const profile = useSelector(selectProfile);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [signOut] = useSendLogoutMutation();

    // --- Logout Handler ---
const handleLogout = async () => {
    try {
        await signOut().unwrap();
        dispatch(logOut()); // ✅ Use the correct action here
        dispatch({ type:  PUSHER_DISCONNECT }); // Disconnect from Pusher
        navigate('/');
    } catch (error) {
        // Even if logout fails, you might still want to disconnect and navigate
        dispatch(logOut()); 
        dispatch({ type:  PUSHER_DISCONNECT });
        navigate('/');
        console.error("Logout failed: ", error);
    }
};
    // --- Current Date Component ---
    const CurrentDate = () => {
        const currentDate = format(new Date(), 'dd/MM/yyyy');
        return <div className="text-white">{currentDate}</div>;
    };

    return (
        <div className="navBar z-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: settings.theme === 'dark' ? '#111111' : settings.navbarColor, padding: '0 1rem', height: '60px' }}>
            {/* Business Name */}
            <div className="logo">
                <div className="text-light fw-bold fs-5">{profile?.busName || "Business Name"}</div>
            </div>

            {/* Current Date & Connection Status */}
            <div className="d-flex align-items-center gap-4">
                <div className="d-flex align-items-center gap-2">
                    <Calendar className="text-white" />
                    <CurrentDate />
                </div>
            </div>

            {/* Profile & Icons */}
            <div className="d-flex align-items-center gap-4">
            <div><ConnectionStatus /></div>
             <div>   {/* User Avatar & Logout */}
                <UserAvatar logout={handleLogout} /></div>
            </div>
        </div>
    );
};

export default NavBar;

