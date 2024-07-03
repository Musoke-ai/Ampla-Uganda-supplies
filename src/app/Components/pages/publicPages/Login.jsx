import {useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../auth/authSlice';
import { useLoginMutation } from '../../../auth/authApiSlice';
import { Business } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';

const Login = () => {
    const userRef = useRef()
    const errRef = useRef()
    const [businessname, setBusinessname] = useState('')
    const [password, setPassword] = useState('')
    const [errMsg, setErrMsg] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [login, { isLoading, isSuccess, isError }] = useLoginMutation()
    const [showError, setShowError] = useState(false);

    useEffect ( () => {
        userRef.current.focus()
    }, [])
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
            const { data: accessToken } = await login ({ email: businessname, password}).unwrap()
            dispatch(setCredentials({ accessToken }))
            setBusinessname('')
            setPassword('')
            if(accessToken.length>0){
                navigate('/splashscreen')
            }
            else if(isError){
                window.alert('Unable to login')
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


    const content = (
        <section className='w-50 h-75 card p-3 d-flex flex-column align-items-center shadow-sm'>
            {isLoading?<LinearProgress sx={{width: '100%'}} />:""}
            <header>
                <h3 className='text-center'>Login Your Business</h3>
                <main>
                    <p ref={errRef} className='errClass' aria-live='assertive'>{errMsg}</p>
                    <form onSubmit={handleSubmit} className='form d-flex flex-column gap-4'>
                       <div>
                        <label htmlFor='bussinesname' className='label'>Business Email:</label>
                        <input 
                        className='form-control'
                        type='text'
                        id='businessname'
                        ref={userRef}
                        value={businessname}
                        onChange={handleUserInput}
                        autoComplete='off'
                        required
                        />
                        </div>
                        <div>
                        <label htmlFor='password' className='label'>Password:</label>
                        <input 
                        className='form-control'
                        type='password'
                        id='password'
                        value={password}
                        onChange={handlePwdInput}
                        required
                        />
                        </div>
                        {isLoading?<button className='btn-sm disabled rounded mainColor text-white p-1' style={{border: "none"}}>Sign In</button>:
                        <button className='btn-sm mainColor text-white rounded p-1' style={{border: "none"}}>Sign In</button>
                        }
                        {/* <button className='btn btn-sm btn-primary'>Sign In</button> */}
                    </form>

{showError?<div className='bg-warning w-100 p-2 text-danger mt-4 mb-3'>{errMsg}</div>:""}

                </main>
                <footer>
                    <br />
                    <Link to="/signup">Register your business</Link>
                </footer>
            </header>
        </section>
    )
  return (
    <div>
      <div className='d-flex flex-column align-content-center w-100 h-100 align-items-center mt-5'>
      {content}
      </div>
    </div>
  );
}

export default Login;
