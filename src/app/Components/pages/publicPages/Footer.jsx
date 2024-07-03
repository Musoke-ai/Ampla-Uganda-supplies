import React from 'react';
import { Link,  useLocation } from "react-router-dom";
import loveIcon from '../../../../../src/madeBy/loveico.gif'
import ugFlag from '../../../../../src/madeBy/ugflag.gif'

const Footer = () => {
  return (
    <div>
    <footer class="text-center mt-5 fs-6 pt-5 border-top">
    <p><Link to="/tc" title="link to myStock terms and conditions">Terms & Conditions</Link> . <Link to="/privacy" title="link to myStock privacy policy">Privacy Policy</Link></p>
    <p className='fw-bold'>
      Made With <img  src={loveIcon} alt='love icon' title='love icon' style={{width:"32px"}} /> in <img src={ugFlag} title='Waving Uganda Flag' alt="Waving Uganda flag" style={{width:"32px",height:"32px"}} />
    </p>
    <p>2024 &copy;poweredStock by <a href="mailto:shayadaptivetechnologies@gmail.com" title="hamza&&steve contact">hamza&&steve</a>. All Rights Reserved</p>
  </footer>
    </div>
  );
}

export default Footer;
