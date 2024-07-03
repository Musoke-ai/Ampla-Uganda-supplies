import { Link,  useLocation } from "react-router-dom";

const Contact = () => {
  return (
    <div  >
      <div >
          <h1 className="text-center mt-5 text-main">poweredStock</h1>
    <h3 className="text-center">Quick help . Contact us right now</h3>
     <br/><p className="fw-bold text-center"> <Link className="nav-link" to="/signup" > <span className="fw-bold text-primary">Try myStock now</span> </Link></p>
    <div className="container justify-content-center mt-5 bg-body-tertiary rounded p-5 shadow border-4"style={{borderTopStyle:"solid", borderTopWidth:"1px", borderTopColor:"#1C4E80"}}>
    <p className="fs-3 text-center mb-5">For help about myStock concerning sales, technical issues, inquiries, business fit questions, how to use the system, and many more. Reach to us now below. WE ARE ON AIR!!!</p>
    <div className="mx-auto justify-content-center fs-5">
    <p className="text-main fw-bold">Mr. Lwetutte Steven</p>
    <p>Call: <a href="tel:0750147072">0750147072</a> / <a href="tel:0750147072">0776033533</a></p>
    <p>WhatsApp: <a href="https://wa.me/256783406932?text=From contact page" target="_blank">0750147072</a></p>
    <p className="text-main fw-bold mt-5">Mr. Musoke Hamza</p>
    <p>Call: <a href="tel:0703299736">0703299736</a> / <a href="tel:0770968736">0770968736</a></p>
    <p>WhatsApp: <a href="https://wa.me/256770968736?text=From contact page" target="_blank">0770968736</a></p>
    <p className="mt-5">Email: <a href="mailto:help@poweredstock.com">help@poweredstock.com</a> / <a href="mailto:support@poweredstock.com">support@poweredstock.com</a></p>
    </div>
  </div>
  </div>
    </div>
  );
}

export default Contact;
