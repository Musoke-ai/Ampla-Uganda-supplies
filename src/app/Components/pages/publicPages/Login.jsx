import {useRef, useState, useEffect } from 'react';

import { Button, Modal, Form, Container, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaIndustry, FaTools, FaCogs } from "react-icons/fa";
// import "animate.css";

import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, setRoles } from '../../../auth/authSlice';

import { useLoginMutation } from '../../../auth/authApiSlice';
import { Business } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';
import usePersist from '../../../hooks/usePersist';

const Login = () => {
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

    if (isSuccess) {
        // navigate('/dashboard')
        // navigate('/splashscreen')
      
    }
    
  return (
  <div className="d-flex justify-content-center align-items-center vh-100 position-relative bg-dark text-light overflow-hidden">
        {/* Green Bubbles */}
        <div
          className="position-absolute bg-success rounded-circle"
          style={{ width: "100px", height: "100px", top: "10px", left: "10px", opacity: 0.3 }}
        ></div>
        <div
          className="position-absolute bg-success rounded-circle"
          style={{ width: "100px", height: "100px", bottom: "10px", right: "10px", opacity: 0.3 }}
        ></div>
        
        {/* Factory Icons with Animation */}
        <FaIndustry className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ top: "20%", left: "5%", fontSize: "50px", opacity: 0.5 }} />
        <FaTools className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ top: "50%", right: "10%", fontSize: "50px", opacity: 0.5 }} />
        <FaCogs className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ bottom: "20%", left: "40%", fontSize: "50px", opacity: 0.5 }} />
        
        <div className=" p-5 bg-black shadow rounded d-flex flex-column gap-2 ">
        <div>{isLoading?<LinearProgress sx={{width: '100%'}} />:"" }</div>
        <div> <h2 className="mb-4 text-success">Login to Ampla Uganda</h2></div>
         <div>
         <Form className=''>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Enter email" 
                  className="bg-dark text-light border-success" 
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
                  className="bg-dark text-light border-success"
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
    <Button variant="success" onClick={handleSubmit}>Login</Button>
  </div>
    <div>
  <p className='mt-2'>Forget password <a href="http://localhost/mystock/index.php/login/magic-link">Use a Login Link</a></p>
   
  </div>

            </Form>

         </div>
         <div>
         {showError?<div className='bg-warning w-100 p-2 text-danger mt-4 mb-3'>{errMsg}</div>:""}
         </div>
        </div>
      </div>
  );
}

export default Login;
