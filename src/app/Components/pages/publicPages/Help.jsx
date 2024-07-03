import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import usage from '../../../../mystockimg/Usage-in-English-Grammar-List-of-Examples-2.webp';
import fit from '../../../../mystockimg/venture-capital-investment-criteria.png';
import faq from '../../../../mystockimg/faq-vector-icon-help-symbol-260nw-1541349005.jpg';

const Help = () => {
  return (
    <div classNameName='d-flex flex-column align-items-center justify-items-center' style={{height: "100vh", overflowY: 'auto'}}>
      <Header />

      <div className='d-flex  flex-column  justify-content-center align-items-center glassyBackground'>
       <h1><div className='text-primary text-bold fs-3'>Help</div></h1> 
        <div>
       <h4>Easily and quickly learn how to get started with poweredStock to keep track of your inventory.</h4> 
        </div>
        </div>

<div className='container'>

<div >

<div className="d-flex gap-2 mt-4 mb-3 shadow-sm">
  <div>
  <img src={usage} class="img" alt="Responsive image"  style={{width:'150px',height:'150px'}} />
  </div>
    <div className="card-text ps-3 ms-2">
      <h5>Usage</h5>
    poweredStock hardware stock management system is a powerful tool that helps businesses of all sizes to track and manage their hardware inventory. With our system, you can easily Track inventory levels in real time, Simply do stock replenishment, Set up debt payment alerts, Generate reports on inventory levels, sales, and more. poweredStock is easy to use and can be customized to meet the specific needs of your business. Whether you're a small hardware store or a large enterprise, our system can help you to improve your inventory management and profitability.
    </div>

</div>
<br />
<br />

<div className="d-flex gap-2 mt-4 mb-3 shadow-sm">
  <div>
  <img src={fit} className="img" alt="Responsive image"  style={{width:'150px',height:'150px'}} />
  </div>
    <div className="card-text ps-3 ms-2">
      <h5>
        Does it fit my business?
      </h5>
    poweredStock is a perfect solution for businesses which deal in tangible items that may or may not differ in terms of names, types, colors, brands and many more.<br/> It is not a good fit for businesses dealing in services or intangible items unless you are very sure it can help necessarily.
    </div>

</div>

</div>

{/* FAQs */}
<div>

<h5 className='mt-2 mb-2 text-center w-100'>FAQs</h5>

<div className='accordion accordian-flush d-flex flex-column justify-content-center align-items-center p-2' id='faqs'>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}} >
      <button className='accordion-button collapsed w-100' type='button'  style={{width:'450px'}}
       data-bs-toggle='collapse' data-bs-target='#q1'  aria-expanded='false' aria-controls='flush-q1'>
      <h6 id="qn" class="fw-bold">How can I add an item to my stock?</h6>
      </button>
    </h2>
    <div id="q1" className='accordion-collapse collapse' data-bs-parent="faqs"  style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">From the side navigation, click inventory. Then go to Add item and then fill and follow instructions on the form.</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
       data-bs-toggle='collapse' data-bs-target='#q2'  aria-expanded='false' aria-controls='flush-q1'>
        <h6 id="qn" class="fw-bold">How do I sell an item?</h6>
      </button>
    </h2>
    <div id="q2" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">After logging in to your business, you can find <b>Quick Sale</b> button at the bottom right of any page be it
      <b>Dashboard, Inventory, Stock.</b> Click and fill the pop up form to make a sale.</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}}  
       data-bs-toggle='collapse' data-bs-target='#q3'  aria-expanded='false' aria-controls='flush-q1'>
        <h6 id="qn" class="fw-bold">How can I record a debt(when you lend an item to someone)?</h6>
      </button>
    </h2>
    <div id="q3" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">
        Log in your business. On your right navigation menu, browse to <b>Debts</b>, click on New debt and fill out the formto record a debt. You can also view everything concerning your debts here.
      </p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}}  
      data-bs-toggle='collapse' data-bs-target='#q4'  aria-expanded='false' aria-controls='flush-q1'>
         <h6 id="qn" class="fw-bold">How do I register my business?</h6>
      </button>
    </h2>
    <div id="q4" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">This is the first step you can take, Go to the top right corner of the top navigation, click on register business and continue with the onscreen instructions. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  
  <div className='accordion-item'>
    <h2 className='accordion-header' style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button'  style={{width:'450px'}}
      data-bs-toggle='collapse' data-bs-target='#q5'  aria-expanded='false' aria-controls='flush-q1'>
          <h6 id="qn" class="fw-bold">How do I login?</h6>
      </button>
    </h2>
    <div id="q5" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body' style={{width:'300px'}}>
      <p class="ms-4">Go to the top right corner of the top navigation, click on register business, then select login and continue with the onscreen instructions. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
       data-bs-toggle='collapse' data-bs-target='#q6'  aria-expanded='false' aria-controls='flush-q1'>
      <h6 id="qn" class="fw-bold">Can I view my sales?</h6>
      </button>
    </h2>
    <div id="q6" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">Yes you easily can. After logging in, you will be able to view your sales and other kinds of transactions right away on the <b>Dashboard</b>. You will also be able to view other insights about your stock.</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
      data-bs-toggle='collapse' data-bs-target='#q7'  aria-expanded='false' aria-controls='flush-q1'>
     <h6 id="qn" class="fw-bold">How do I see those I demand?</h6>
      </button>
    </h2>
    <div id="q7" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">After logging in, navigate to <b>Debts</b> on the right side navigation, you will be able to view all the information about the debts you've given out. You can also access othe features on this page such as adding new debt.</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}}  
      data-bs-toggle='collapse' data-bs-target='#q8'  aria-expanded='false' aria-controls='flush-q1'>
     <h6 id="qn" class="fw-bold">How do I pay?</h6>
      </button>
    </h2>
    <div id="q8" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">Currently, you can only pay physically or via a call to us(0750147072/0785363423). In the near future, we are to add Payment using MoMo or cards to ease the process for you. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
      data-bs-toggle='collapse' data-bs-target='#q9'  aria-expanded='false' aria-controls='flush-q1'>
    <h6 id="qn" class="fw-bold">I have money on my simcard, can I pay using mobile money?</h6>
      </button>
    </h2>
    <div id="q9" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">Not for now, but we are actively working hard to add the Pay By MoMo option to ease your payment process. Bare with us, please. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
       data-bs-toggle='collapse' data-bs-target='#q10'  aria-expanded='false' aria-controls='flush-q1'>
   <h6 id="qn" class="fw-bold">Which poweredStock package should pay for?</h6>
      </button>
    </h2>
    <div id="q10" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">If you don't wish to get insights about the performance of your business stock, pay for Gold. But if you need to know and project the future perfomance of your business stock and more highlights about your stock, then pay for Diamond. Call 0750147072/0776033533 for more explanations. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
     data-bs-toggle='collapse' data-bs-target='#q11'  aria-expanded='false' aria-controls='flush-q1'>
 <h6 id="qn" class="fw-bold">Can I get quick help?</h6>
      </button>
    </h2>
    <div id="q11" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">That's why we are always on air, 0750147072(call or WhatsApp) /0776033533(call only). Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
       data-bs-toggle='collapse' data-bs-target='#q12'  aria-expanded='false' aria-controls='flush-q1'>
   <h6 id="qn" class="fw-bold">What are the terms and conditions?</h6>
      </button>
    </h2>
    <div id="q12" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">In order to read and understand our terms and conditions, click  <Link to="/tc" title="link to myStock privacy policy">here</Link>, please. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

  <div className='accordion-item'>
    <h2 className='accordion-header'  style={{width:'450px'}}>
      <button className='accordion-button collapsed w-100' type='button' style={{width:'450px'}} 
     data-bs-toggle='collapse' data-bs-target='#q13'  aria-expanded='false' aria-controls='flush-q1'>
   <h6 id="qn" class="fw-bold">Can I have a look at the privacy policy?</h6>
      </button>
    </h2>
    <div id="q13" className='accordion-collapse collapse' data-bs-parent="faqs" style={{width:'450px'}}>
      <div className='accordion-body'>
      <p class="ms-4">Yes ofcourse, you can access the privacy policy by clicking  <Link to="/privacy" title="link to myStock privacy policy">here</Link><a href="" title="privacy policy">here</a>. Thank you for choosing poweredStock!</p>
      </div>
    </div>
  </div>

</div>

</div>
</div>
      <Footer />
    </div>
  );
}

export default Help;
