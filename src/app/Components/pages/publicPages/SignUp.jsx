import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
} from "@mui/material";
import Alerts from '../../actions/Alerts'
import Checkbox from '@mui/material/Checkbox';

import { Link } from "react-router-dom";
import { useRegisterMutation } from "../../../auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import { WindowDesktop } from "react-bootstrap-icons";

const steps = ["Basic Info", "Location", "Security", "Login"];

// Password regular Expressions
// 1. The password atleast 8 characters long (?=.{8,}).
// 2. The password has atleast one Uppercase letter (?=.*[A-Z]).
// 3. The password has atleast one lowercase letter (?=.*[a-z]).
// 4. The password has atleast one digit (?=.*[0-9]).
// 5. The password has atleast one special character ([^A-Za-z0-9]).

// Strong password RegEx.
// (?=.*[a-z])(?=.*[A-Z])(?=.[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})

// Medium password RegEx.
// ((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])((?=.{6,})))|((?=.*[a-z])(?=.*[A-Z])(?=.[0-9])(?=.*[^A-Za-z0-9])(?=.{8,}))

const SignUp = () => {
  
  const navigate = useNavigate();
  const [register, {isLoading, isSuccess}] = useRegisterMutation();

  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());

  const businessNameRef = useRef();
  const locationRef = useRef();
  const emailRef = useRef();

  const [businessName, setBusinessName] = useState("");
  const [owner, setOwner] = useState("");
  const [contactOne, setContactOne] = useState("");
  const [contactTwo, setContactTwo] = useState("");
  const [location, setLocation] = useState("");
  const [building, setBuilding] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  // const [logo, setLogo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [comfirmpassword, setComfirmpassword] = useState("");
  const [pwMatch, setPwMatch] = useState(false);
  const [pwValidity, setPwValidity] = useState(false);
  const [emailValidity, setEmailValidity] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const [isChecked, setIsChecked] = useState(false);
  // const [checked, setChecked] = useState(true);

  const handleChange = () => {
    setIsChecked(prev => !prev);
  };

  const onbusinessNameChange = (e) => (setBusinessName(e.target.value));
  const onOwnerChange = (e) => (setOwner(e.target.value));
  const onContactoneChange = (e) => (setContactOne(e.target.value));
  const onContacttwoChange = (e) => (setContactTwo(e.target.value));
  const onLocationChange = (e) => (setLocation(e.target.value));
  const onBuildingChange = (e) => (setBuilding(e.target.value));
  const onShopNumberChange = (e) => (setShopNumber(e.target.value));
  const onLogoChange = (e) => {
    // const selectedFile = e.target.files[0];
    // setLogo(selectedFile);
  };
  const onEmailChange = (e) => (setEmail(e.target.value));
  const onPasswordChange = (e) => (setPassword(e.target.value));
  const onComfirmPasswordChange = (e) => (setComfirmpassword(e.target.value));

  const onComfirmT_C = (e) => {setIsChecked((prev) => !prev)};

  useEffect(() => {
    if(businessNameRef.current !== undefined)
    {
      businessNameRef.current.focus();
    }
  }, [])

  const checkEmail= (email) => {
    let emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9-]+)*$/;
    
    if(emailRegex.test(email)){
      setEmailValidity(true)
      // setEmailValidity(true)
      // console.log(email +" email valid "+emailValidity)
    }else{
         setEmailValidity(false);
        //  setEmailValidity(false);
        //  console.log(email+ " email not valid "+emailValidity)
    }
  }
  const checkPassword = (password) => {
// let passwordValidity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/;
let passwordValidity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if(passwordValidity.test(password)){
  setPwValidity(true)
  // console.log(password +" Password valid "+pwValidity)
}else{
     setPwValidity(false);
    //  console.log(password+ " Password not valid "+pwValidity)
}
  }

  useEffect(() => {
    setShowAlert(false);
    checkPassword(password);
  }, [password])

  useEffect(() => {
    setShowEmail(false);
    checkEmail(email);
  }, [email])

  useEffect(() => {
    if(password.length>=6){
    if(password === comfirmpassword){
      setPwMatch(true);
    }
    else{
      setPwMatch(false);
    }}else{
      setPwMatch(false);
    }
  }, [password, comfirmpassword])

  useEffect( () => {
if(activeStep === 1){
  locationRef.current.focus();
}else if(activeStep === 2){
  emailRef.current.focus();
}
else{
  businessNameRef.current.focus();
}
  },[activeStep])

  const isOkToRegister = [businessName,contactOne,email,location,pwMatch,building, isChecked].every(Boolean);

  const isStepOptional = (step) => {
    return step === 1;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    checkEmail(email);
    setShowEmail(false);
    setShowAlert(false);
    if(!emailValidity){
      setShowEmail(true);
      // console.log(showEmail+" Email validity false");
    }else {
    if(!pwValidity){
      setShowAlert(true);
      // console.log("Pw validity false");
    }
    else{
    if(isChecked){
    try{
      await register(
      {
         businessName: businessName,
         busLogo: "",
         location: location,
         building: building,
         shopNumber: shopNumber,
         contactOne: contactOne,
         contactTwo: contactTwo,
         email: email,
         owner: owner,
         password: password
        }
      ).unwrap();
      navigate('/login');

    } catch (err) {
      // return <Alerts heading="An error occured during registration!" message={error}/>
      if (!err.status) {
        // setErrMsg('No Server Response')
      window.alert("No Server Response")

        // setShowError(true)
    } else if (err.status === 400) {
      window.alert("Check your credentials and try again.")
        // setErrMsg('Missing Businessname or Password');
        // setShowError(true)
    } else if (err.status === 401) {
      window.alert("Unauthorised")
        // setErrMsg('Unauthorised');
        // setShowError(true)
    } 
    else if (err.status === 404) {
      window.alert("Not Found")
        // setErrMsg('Unauthorised');
        // setShowError(true)
    }
    else if (err.status === 500) {
      window.alert("Internal Server Error")
        // setErrMsg('Unauthorised');
        // setShowError(true)
    }
    else if (err.status === 503) {
      window.alert("Service unavailable")
        // setErrMsg('Unauthorised');
        // setShowError(true)
    }
    else {
      window.alert("Check your credentials and try again.")
        // setErrMsg('Check your credentials and try again.');
        // setShowError(true)
        // errRef.current.focus();
    }
    }
  } else {
    window.alert("Please Accept our Terms and Conditions to continue!")
  }
}
  
  }
};

  return (
    <div className="d-flex flex-column align-items-center mt-5 position-relative">
      {/* {
        showAlert?<div className="position absolute w-75%" >
         <Alerts 
         delay={10000}
         autoHide={true}
         heading='The password provided must follow the follow criteria'
         message="
          The password must be between 8 and 15 Characters.
          The password has to contain altleast one uppercase and lowercase characters.
          The password has to contain atlest one digit.
          The password has to contain alteast one special character (!@#$%^&*?).
          "
           /></div>:""
      } */}
      {/* {
        showEmail?<div className="position absolute w-75%" >
         <Alerts 
         delay={10000}
         autoHide={true}
         heading='invalid Email'
         message="
         The Email provided is invalid
          "
           /></div>:""
      } */}
      <h4 className="text-center w-100 mb-3">Signup Your Business</h4>
      <section
        className="card shadow-sm w-50 pt-4 d-flex flex-column ps-2 pe-2 position-relative"
        style={{ height: "400px" }}
      >
           {
              isLoading?<LinearProgress className="position-absolute top-0 w-100" />:""
            }
        {activeStep !== 3 ? (
          <div>
            {" "}
            <Stepper activeStep={activeStep}>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {};
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <br />
          </div>
        ) : (
          ""
        )}

        {activeStep === 0 ? (
          <div>
            <div className="container">
              <div className="row">
                <div className="col-12 mt-3 mb-2">
                  <label htmlFor="businessname">Business Name:<sup className="text-danger">*</sup></label>
                  <input
                    type="text"
                    id="businessname"
                    value={businessName}
                    className="form-control"
                    ref={businessNameRef}
                    onChange={onbusinessNameChange}
                  />
                </div>
                <div className="col-12  mt-3 mb-2">
                  <label htmlFor="businessowner">Business Owner:<sup className="text-danger">*</sup></label>
                  <input
                    type="text"
                    id="businessowner"
                    value={owner}
                    className="form-control"
                    onChange={onOwnerChange}
                  />
                </div>

                <div className="row">
                  <div className="col-6  mt-3 mb-2">
                    <label htmlFor="businesscontact1">
                      Business Contact 1 <sup className="text-danger">*</sup>
                    </label>
                    <input
                      type="text"
                      id="businesscontact1"
                      value={contactOne}
                      className="form-control"
                      onChange={onContactoneChange}
                    />
                  </div>
                  <div className="col-6  mt-3 mb-2">
                    <label htmlFor="businesscontact2">
                      Business Contact 2
                      <small className="text-success">(Optional)</small>
                    </label>
                    <input
                      type="text"
                      id="businesscontact2"
                      value={contactTwo}
                      className="form-control"
                      onChange={onContacttwoChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between w-100 position-absolute bottom-0">
              <Box sx={{ flex: "1 1 auto" }} />
              <Button onClick={handleNext} className="me-4 mb-2">
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        ) : (
          ""
        )}
        {activeStep === 1 ? (
          <div>
            <div className="container">
              <div className="row">
                <div className="col-12 mt-3 mb-2">
                  <label htmlFor="businesslocation">Business Location:<sup className="text-danger">*</sup></label>
                  <input
                    type="text"
                    id="businesslocation"
                    ref={locationRef}
                    value={location}
                    className="form-control"
                    onChange={onLocationChange}
                  />
                </div>
                <div className="col-12  mt-3 mb-2">
                  <label htmlFor="building">Building   <small className="text-success">(Optional)</small></label>
                  <input type="text" id="building" value={building} className="form-control" onChange={onBuildingChange} />
                </div>

                <div className="row">
                  <div className="col-6  mt-3 mb-2">
                    <label htmlFor="shopno">Shop Number   <small className="text-success">(Optional)</small></label>
                    <input
                      type="text"
                      id="shopno"
                      value={shopNumber}
                      className="form-control"
                      placeholder="F-10"
                      onChange={onShopNumberChange}
                    />
                  </div>
                  {/* <div className="col-6  mt-3 mb-2">
                    <label htmlFor="businesslogo">Business Logo:</label>
                    <input
                      type="file"
                      id="businesslogo"
                      className="form-control"
                      onChange={onLogoChange}
                    />
                  </div> */}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between position-absolute bottom-0 w-100">
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
                className="mb-2 ms-1 text-primary"
              >
                Back
              </Button>
              <Button
                color="inherit"
                onClick={handleNext}
                sx={{ mr: 1 }}
                className="mb-2 me-3 text-primary"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          ""
        )}
        {activeStep === 2 ? (
          <div>
            <div className="container">
              <div className="row">
                <div className="col-12  mt-3 mb-2">
                  <label htmlFor="businessemail">Business Email:<sup className="text-danger">*</sup></label>
                  <input
                    type="text"
                    id="businessemail"
                    value={email}
                    ref={emailRef}
                    className="form-control"
                    required
                    autoComplete="false"
                    onChange={onEmailChange}
                  />
                </div>
                {
                  showEmail?
                  <div className="text-danger">
                    <small>Invalid email entered!</small>
                  </div>
                  :
                  ""
                }

                <div className="row">
                  <div className="col-6  mt-3 mb-2">
                    <label htmlFor="password">Password:<sup className="text-danger">*</sup></label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      className={pwMatch?"form-control border border-success":"form-control"}
                      required
                      autoComplete="false"
                      onChange={onPasswordChange}
                    />
                  </div>
                  <div className="col-6  mt-3 mb-2">
                    <label htmlFor="comfirmpassword">Comfirm password:<sup className="text-danger">*</sup></label>
                    <input
                      type="password"
                      id="comfirmpassword"
                      value={comfirmpassword}
                      className={pwMatch?"form-control border border-success":"form-control"}
                      required
                      autoComplete="false"
                      onChange={onComfirmPasswordChange}
                    />
                  </div>

                  <div>
                    {showAlert?<div className="text-danger" style={{height:"60px",overflowY:"auto"}}>
                    <small className="text-warning"> 
                    1. Password must be at least 8 characters long,<br />
                    2. contain at least one uppercase letter,<br />
                    3. one lowercase letter, one digit, and one special character.
                    </small>
                    </div>:<div></div>}
                  </div>

                  <div className="form-check col-12 mt-4 ms-3">
                   <Checkbox
      checked={isChecked}
      onChange={handleChange}
      inputProps={{ 'aria-label': 'controlled' }}
    />
                    <label
                      className="form-check-label text-danger fs-6"
                      htmlFor="comfirmT&C"
                    >
                      ACCEPT TERMS AND CONDITIONS
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between position-absolute bottom-0 w-100">
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
                className="mb-2 ms-3 text-primary"
              >
                Back
              </Button>
              
            {isOkToRegister?  
            <button
            type="button"
            className="btn btn-sm  btn-primary btn-sm me-4 mb-2"
            onClick={handleSubmit}
            >
              Register
              </button>
          :
            <button
            type="button"
            className="btn btn-sm  btn-primary btn-sm me-4 mb-2"
            disabled
            >
              Register
              </button>
              }
            </div>
          </div>
        ) : (
          ""
        )}
      </section>
      <div>
        <Button className="">
          <Typography variant="inherit" color="textPrinary">
            <Link to="/login">
              {" "}
              Already a member{" "}
              <small>
                <a>Login here</a>
              </small>{" "}
            </Link>
          </Typography>
        </Button>
      </div>
    </div>
  );
};

export default SignUp;
