import React from "react";
import Badge from '@mui/material/Badge';
import NotificationsIcon from "@mui/icons-material/Notifications";
import  Avatar  from '@mui/material/Avatar';
import { Cancel, Logout, Save } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import Offcanvas from 'react-bootstrap/Offcanvas';
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import { Camera, PencilFill } from "react-bootstrap-icons";

import {useSendLogoutMutation} from '../auth/authApiSlice'
import { useUpLoadLogoMutation } from "../auth/authApiSlice";
import { useUpdateProfileMutation } from "../auth/authApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectProfile } from "../auth/authSlice";
import { selectCurrentToken } from "../auth/authSlice";
import { CircularProgress, LinearProgress } from "@mui/material";

const NavBar = () => {
  const profile = useSelector(selectProfile);
  const token = useSelector(selectCurrentToken)
  const [showCanvas, setShowCanvas] = useState(false)
  const handleClose = () => setShowCanvas(false)
  const handleShow = () => setShowCanvas(true);
  const [edit, setEdit] = useState(false);

  const busNameRef = useRef();
  const fileInputRef = useRef();
  const navigate = useNavigate();
  
  const dispatch = useDispatch()
  const [signOut, {isLoading, isError, isSuccess}] = useSendLogoutMutation();
  const [profileUpdate, {isLoading:updateLoading,isSuccess:updateSuccess}] = useUpdateProfileMutation();
  const [uploadlogo, {isloading:upLoadLoading,isSuccess:upLoadSuccess}] = useUpLoadLogoMutation();

  const [businessName, setBusinessName] = useState("");
  const [owner, setOwner] = useState("");
  const [contactOne, setContactOne] = useState("");
  const [contactTwo, setContactTwo] = useState("");
  const [location, setLocation] = useState("");
  const [building, setBuilding] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState("");

  const canUpdate =  businessName.length>0 || owner.length>0 || contactOne.length>0 || contactTwo.length>0 || location.length>0 || building.length>0 || shopNumber.length>0 || email.length>0;

  const onbusinessNameChange = (e) => (setBusinessName(e.target.value));
  const onOwnerChange = (e) => (setOwner(e.target.value));
  const onContactoneChange = (e) => (setContactOne(e.target.value));
  const onContacttwoChange = (e) => (setContactTwo(e.target.value));
  const onLocationChange = (e) => (setLocation(e.target.value));
  const onBuildingChange = (e) => (setBuilding(e.target.value));
  const onShopNumberChange = (e) => (setShopNumber(e.target.value));
  const onLogoChange = (e) => {
    const selectedFile = e.target.files[0];
    setLogo(selectedFile);
  };
  const onEmailChange = (e) => (setEmail(e.target.value));

  const setFocus = () => {
    if(edit){
      busNameRef.current.focus();
    }
  }

const handleLogoUpload = async(file) => {
  // console.log("infile: "+Object.keys(file))
try {
uploadlogo({logo: file}).unwrap();
}catch (error) {
// console.log("Error: "+error);
}
}

  const handlefileInput = () => {
    fileInputRef.current.click();
    }

    const handleFileChange = (event) => {
      // const fileObj = e.target.files && e.target.files[0];
      // if (!fileObj){console.log("Empty files");return;}
      // console.log("Files: "+fileObj);
      // e.target.value = null;
      // console.log("Empty: "+e.target.files);
      // console.log(fileObj);
      // console.log(fileObj?.name);
      // handleLogoUpload(fileObj);
      const file = event.target.files;
      const formData = new FormData();
      formData.append('file', file);
      // console.log("formData: "+ Object.keys(formData));
     
    }
    

const handleLogout = async () => {
try{
await signOut().unwrap()
navigate('./login')
}catch (error) {
}

}

const updateReset = () =>{
setBusinessName("");
setLocation("");
setBuilding("");
setShopNumber("");
setContactOne("");
setContactTwo("");
setOwner("");
}

const handleProfileUpdate = async () => {
  try{
await profileUpdate({
  businessName: businessName.length>0?businessName:profile?.busName,
  location: location.length>0?location:profile?.busLocation,
  building: building.length>0?building:profile?.busBuilding,
  shopNumber: shopNumber.length>0?shopNumber:profile?.busNumberShop,
  contactOne: contactOne.length>0?contactOne:profile?.busContactOne,
  contactTwo: contactTwo.length>0?contactTwo:profile?.busContactTwo,
  owner: owner.length>0?owner:profile?.busOwner,
}).unwrap();
setBusinessName("");
setLocation("");
setBuilding("");
setShopNumber("");
setContactOne("");
setContactTwo("");
setOwner("");
  }catch (error){
// console.log(error);
  }
}

  return (
    <div className="navBar z-2">
        {/* <div className=" header mb-2 mt-2" style={{zIndex: 250}}></div> */}
        <div></div>
      <div className="Profile" >
        {/* <div className="notify" >
      <Badge badgeContent={4} color="warning" >
      <NotificationsIcon sx={{color: "white"}} />
    </Badge>
    </div> */}
        <div className="profileInfo text-white" onClick={handleShow}>
          <div className="info text-center p-2" >{profile?.busName}</div>
          <div className="avatar" >
          {/* <Avatar
  alt="Remy Sharp"
  // src="/icons/EdrickLogo.png"
  sx={{ width: 30, height: 30, paddingRight: 0.6,backgroundColor: 'white'}}
/> */}
          </div>
        </div>
      </div>

<Offcanvas 
show={showCanvas}
onHide={handleClose}
placement="end"
>
  <Offcanvas.Header style={{backgroundColor: "#1C4E80"}} className="text-white shadow-sm" closeButton >
    <Offcanvas.Title >
      User Page
    </Offcanvas.Title>
  </Offcanvas.Header>
  <Offcanvas.Body>
  <Tabs 
  defaultActiveKey="home"
  id="uncontrolled-tab"
  className="mb-3"
  >
<Tab
eventKey="home"
title="Business Profile"
>
<div class="d-flex flex-column  align-items-center ">
  <div >
    <div style={{position: 'relative'}}>
  <Avatar
  alt="User profile"
  // src="/icons/EdrickLogo.png"
  sx={{ width: '7rem', height: '7rem', paddingRight: 0.6}}
  className="shadow-sm p-1"
/>
<div style={{position: 'absolute',right: '2px', bottom: '5px'}}>
  <input 
  style={{display:"none"}}
  ref={fileInputRef}
  type="file"
  onChange={handleFileChange}
  />
<button className="btn btn-sm btn-light d-flex align-items-center justify-content-center" disabled onClick={handlefileInput}><Camera /></button>
</div>
</div>
  </div>
  <div>
  {updateLoading?<LinearProgress />:""}
    <div className="d-flex w-100 h-100 justify-content-between align-items-center mt-3 mb-3 bg-light p-2 shadow-sm" >
    <div >
      <h6>{edit?<input ref={busNameRef} type="text" className="form-control border-end-0 border-top-0 border-start-0 " placeholder={profile?.busName} value={businessName} onChange={onbusinessNameChange} />:profile?.busName}</h6>
    </div>
    <div className="d-flex gap-2" >
     {edit?<div>{canUpdate?<button className="btn btn-sm btn-light" onClick={handleProfileUpdate} ><Save /> </button>:<button className="btn btn-sm btn-light disabled" ><Save /> </button>}</div>:"" }
     <button className="btn btn-sm btn-light" onClick={()=>{
      setEdit((prev)=>!prev);
      setFocus();
    }} > {edit?<button onClick={updateReset}><Cancel /></button>:<PencilFill />} </button> 
    </div>
    </div>

    <ul className="list-group list-group-flush w-100">
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold"> Business Owner: </div>
        <div className="ms-3">{edit?<input type="text" className="form-control border-end-0 border-top-0 border-start-0 " onChange={onOwnerChange} value={owner} placeholder={profile?.busOwner} />:profile?.busOwner}</div>
      </li>
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold"> Business Email: </div>
        <div className="ms-3">{edit?<input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onEmailChange} value={email} placeholder={profile?.busEmail} />:profile?.busEmail}</div>
      </li>
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold"> Contacts:</div>
        <div className="ms-3">{edit?
        <div className="d-flex gap-2">
          <input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onContactoneChange} value={contactOne} placeholder={profile?.busContactOne} />
          <div>or</div>
          <input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onContacttwoChange} value={contactTwo} placeholder={profile?.busContactTwo} />
          
        </div>:<div><span>{profile?.busContactOne}</span>{profile?.busContactTwo}</div> }</div>
      </li>
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold">Location: </div>
        <div className="ms-3">{edit?<input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onLocationChange} value={location} placeholder={profile?.busLocation} />:profile?.busLocation}</div>
      </li>
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold"> Building: </div>
        <div className="ms-3">{edit?<input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onBuildingChange} value={building} placeholder={profile?.busBuilding} />:profile?.busBuilding}</div>
      </li>
      <li className="list-item d-flex justify-content-between border-bottom pb-2 mt-2">
        <div className="fw-bold">Shop Number: </div>
        <div className="ms-3">{edit?<input type="text" className="form-control border-end-0 border-top-0 border-start-0   " onChange={onShopNumberChange} value={shopNumber} placeholder={profile?.busNumberShop} />:profile?.busNumberShop}</div>
      </li>
    </ul>

  </div>
  <div className="mt-3 w-100 d-flex justify-content-center pt-1 pb-1 shadow" style={{backgroundColor: '#488A99'}}>
    {isLoading?
    <div className="d-flex justify-content-center align-items-center text-white gap-"><div>Logging out </div><div><CircularProgress /></div></div>
    :<button className="btn btn-sm shadow-sm btn-white-outline text-white d-flex justify-content-center align-content-center" onClick={ handleLogout}><span className="text-white fw-bold">Logout</span>&nbsp;<Logout /></button>}
  </div>
  </div>
</Tab>
<Tab
eventKey="contact"
title="Settings"
>
  Coming soon...
</Tab>
  </Tabs>
  </Offcanvas.Body>
</Offcanvas>

    </div>
  );
};

export default NavBar;
