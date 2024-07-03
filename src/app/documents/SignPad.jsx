import { Cancel } from '@mui/icons-material';
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';


const SignPad = ({setShow, setSignURL}) => {
    const signPad = useRef();
    const [signatureURL,setsignatureURL] = useState('');

    const handleClear = ()=>{
        signPad.current.clear();
        setSignURL(null);
       }
       const handleSave = ()=>{
         const signature = signPad.current.getTrimmedCanvas().toDataURL();
         setSignURL(signature);
       }

       const handleClose = () => {
        setShow(false);
       }

  return (
    <div>
            <div class="card text-center mt-5 ms-5 shadow" style={{width:550,height:400}}>
  <div class="card-header fw-bold d-flex justify-content-between align-items-center">
   <div className='text-center'>Sign pad</div> 
   <div> <button type='button' className='btn btn-small btn-transparent text-danger' onClick={handleClose} ><Cancel /></button></div>
  </div>
  <div class="card-body p-0 pt-3">
  <SignatureCanvas ref={signPad} 
    penColor='black'
    canvasProps={{width: 500, height: 240, className: 'shadow-sm border rounded border-dark'}}
    />
  </div>
  <div class="card-footer text-muted d-flex justify-content-between">
    <button className='btn btn-sm btn-danger' onClick={handleClear}>clear</button>
    <button className='btn btn-sm btn-info' onClick={handleSave}>Save</button>
  </div>
</div>
    </div>
  );
}

export default SignPad;
