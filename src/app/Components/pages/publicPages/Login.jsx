import {useRef, useState, useEffect } from 'react';

import { Button, Modal, Form, Container, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaIndustry, FaTools, FaCogs } from "react-icons/fa";
import { ChatDots, GraphUpArrow, ShieldCheck } from "react-bootstrap-icons";
// import "animate.css";

import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, setRoles } from '../../../auth/authSlice';

import { useLoginMutation } from '../../../auth/authApiSlice';
import { Business } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';
import usePersist from '../../../hooks/usePersist';
import { useSettings } from '../../Settings';

const amplaLogo = `${process.env.PUBLIC_URL || ""}/logos/ampla_logo.png`;

const Login = () => {
     const { settings } = useSettings();
     const [show, setShow] = useState(false);
     const [role, setRole] = useState("admin");
    const userRef = useRef()
    const errRef = useRef()
    const [businessname, setBusinessname] = useState('')
    const [password, setPassword] = useState('')
    const [errMsg, setErrMsg] = useState('');

    const [isChecked, setIsChecked] = useState(false);

      // Toggle the checkbox state
  const handleToggle = () => {
    setPersist(prev => !prev);
  };

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [login, { isLoading, isSuccess, isError }] = useLoginMutation()
    const [showError, setShowError] = useState(false);

    const [persist, setPersist] = usePersist();

  const handleClose = () => {
    setShow(false);
    setPassword("");
    setShowError("");
  };

  const handleShow = (selectedRole) => {
    setRole(selectedRole);
    setShow(true);
  };

    // useEffect ( () => {
    //     userRef.current.focus()
    // }, [])
    useEffect ( () => {
        setShowError(false)
    }, [password,businessname])

    useEffect ( () => {
        setErrMsg('')
    }, [])

    const handleUserInput = (e) => setBusinessname(e.target.value)
    const handlePwdInput = (e) => setPassword(e.target.value)

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { data: credentials } = await login ({ email: businessname, password}).unwrap();
            const accessToken = credentials.accessToken;
            const roles = credentials.roles;
            dispatch(setCredentials({ accessToken }));
            dispatch(setRoles({ roles }));
            setBusinessname('')
            setPassword('')
            if(accessToken.length>0){
                navigate('/prefetch')
            }
            else if(isError){
                // window.alert('Unable to login')
                navigate('/login')
            }
            // else{
            //     navigate('/login')
            // }
        } catch (err) {
            if (!err.status) {
                setErrMsg('No Server Response')
                setShowError(true)
            } else if (err.status === 400) {
                setErrMsg('Missing Business Email or Password');
                setShowError(true)
            } else if (err.status === 401) {
                setErrMsg('Unauthorised');
                setShowError(true)
            } else {
                setErrMsg('Check your credentials and try again.');
                setShowError(true)
                // errRef.current.focus();
            }
        }

    }

    const errClass = errMsg ? "errmsg" : "offscreen"
    const isDark = settings?.theme === "dark";
    const accent = settings?.navbarColor || "#2f8f57";
    const pageStyle = {
      backgroundColor: "var(--ampla-app-bg, #f8fbf8)",
      color: "var(--ampla-text-color, #15202b)",
    };
    const cardStyle = {
      backgroundColor: "var(--ampla-surface-bg, #ffffff)",
      color: "var(--ampla-text-color, #15202b)",
      border: "1px solid var(--ampla-border-color, #e7efe9)",
      boxShadow: "var(--ampla-shadow, 0 20px 50px rgba(15,23,42,0.16))",
      width: "min(92vw, 430px)",
    };
    const inputStyle = {
      backgroundColor: "var(--ampla-input-bg, #ffffff)",
      color: "var(--ampla-text-color, #15202b)",
      borderColor: "var(--ampla-border-color, #dce7df)",
    };
    const aiPanelStyle = {
      width: "min(92vw, 460px)",
      background:
        settings?.theme === "dark"
          ? "linear-gradient(145deg, rgba(var(--ampla-accent-rgb, 47, 143, 87), 0.18), rgba(17, 25, 23, 0.94))"
          : "linear-gradient(145deg, rgba(var(--ampla-accent-rgb, 47, 143, 87), 0.14), rgba(255, 255, 255, 0.96))",
      color: "var(--ampla-text-color, #15202b)",
      border: "1px solid var(--ampla-border-color, #e7efe9)",
      boxShadow: "var(--ampla-shadow, 0 20px 50px rgba(15,23,42,0.16))",
      backdropFilter: "blur(12px)",
    };
    const aiIconStyle = {
      width: 42,
      height: 42,
      display: "grid",
      placeItems: "center",
      borderRadius: 14,
      backgroundColor: "var(--ampla-accent-soft, rgba(47,143,87,0.12))",
      color: accent,
      flexShrink: 0,
    };

    if (isSuccess) {
        // navigate('/dashboard')
        // navigate('/splashscreen')
      
    }
    
  return (
  <div
    className="d-flex justify-content-center align-items-center min-vh-100 position-relative overflow-auto"
    style={{
      ...pageStyle,
      minHeight: "100vh",
      padding: "1.5rem 0",
    }}
  >
        {/* Green Bubbles */}
        <div
          className="position-absolute rounded-circle"
          style={{ width: "100px", height: "100px", top: "10px", left: "10px", opacity: isDark ? 0.18 : 0.22, backgroundColor: accent }}
        ></div>
        <div
          className="position-absolute rounded-circle"
          style={{ width: "100px", height: "100px", bottom: "10px", right: "10px", opacity: isDark ? 0.18 : 0.22, backgroundColor: accent }}
        ></div>
        
        {/* Factory Icons with Animation */}
        <FaIndustry className="position-absolute animate__animated animate__fadeIn animate__slower" style={{ top: "20%", left: "5%", fontSize: "50px", opacity: 0.34, color: accent }} />
        <FaTools className="position-absolute animate__animated animate__fadeIn animate__slower" style={{ top: "50%", right: "10%", fontSize: "50px", opacity: 0.34, color: accent }} />
        <FaCogs className="position-absolute animate__animated animate__fadeIn animate__slower" style={{ bottom: "20%", left: "40%", fontSize: "50px", opacity: 0.34, color: accent }} />
        
        <div
          className="d-flex align-items-stretch justify-content-center gap-4 flex-column flex-lg-row px-3 py-3"
          style={{ zIndex: 2, width: "100%" }}
        >
        <div className="p-4 p-md-5 rounded d-flex flex-column justify-content-between gap-4" style={aiPanelStyle}>
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ backgroundColor: "var(--ampla-surface-bg, #ffffff)", border: "1px solid var(--ampla-border-color, #e7efe9)", color: accent, fontWeight: 700 }}>
              <ChatDots size={16} />
              Ampla Copilot
            </div>
            <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.55rem)", lineHeight: 1.08 }}>
              Ask your business what is happening, then act faster.
            </h1>
            <p className="mb-0" style={{ color: "var(--ampla-muted-color, #6f7d8c)", lineHeight: 1.7 }}>
              After sign-in, Ampla Copilot helps teams explore live inventory,
              sales, customers, production, and raw material data in plain language.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex gap-3 align-items-start">
              <div style={aiIconStyle}>
                <GraphUpArrow size={18} />
              </div>
              <div>
                <div className="fw-bold">Operational answers</div>
                <div className="small" style={{ color: "var(--ampla-muted-color, #6f7d8c)", lineHeight: 1.6 }}>
                  Review stock health, sales patterns, customer activity, and production performance without digging through every page.
                </div>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-start">
              <div style={aiIconStyle}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="fw-bold">Built into your workflow</div>
                <div className="small" style={{ color: "var(--ampla-muted-color, #6f7d8c)", lineHeight: 1.6 }}>
                  Designed for managers and operators who need quick context while keeping access controlled by their account role.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 shadow rounded d-flex flex-column gap-2" style={cardStyle}>
        <div>{isLoading?<LinearProgress sx={{width: '100%'}} />:"" }</div>
        <div className="d-flex flex-column align-items-center">
          <img
            src={amplaLogo}
            alt="Ampla Uganda"
            width={76}
            height={76}
            className="rounded shadow-sm mb-3"
            style={{ objectFit: "cover" }}
          />
          <h2 className="mb-4 text-center" style={{ color: accent }}>Ampla Uganda</h2>
        </div>
        <div> <h2 className="mb-4 text-center" style={{ color: accent }}>Login</h2></div>
         <div>
         <Form className=''>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Enter email" 
                  style={inputStyle}
                  id='businessname'
                  ref={userRef}
                 value={businessname}
                 onChange={handleUserInput}
                 autoComplete='off'
                 required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                 type='password'
                 id='password'
                 value={password}
                 onChange={handlePwdInput}
                 required
                  style={inputStyle}
                />
              </Form.Group>

    <div>
    <label>
      <input
        type="checkbox"
        id='persist'
        checked={persist}
        onChange={handleToggle}
      />
      I trust this Device
    </label>
    <p>{persist ? 'You trust this Device.' : 'You do not trust this Device.'}</p>
    <Button
      variant="success"
      className='w-100'
      onClick={handleSubmit}
      style={{ backgroundColor: accent, borderColor: accent, fontWeight: 700 }}
    >
      Login
    </Button>
  </div>
    <div>
  <p className='mt-2'>Forget password <Link to="/magic-login">Use a Login Link</Link></p>
   
  </div>

            </Form>

         </div>
         <div>
         {showError?<div className='bg-warning w-100 p-2 text-danger mt-4 mb-3'>{errMsg}</div>:""}
         </div>
        </div>
        </div>
      </div>
  );
}

export default Login;
