import { Avatar } from "@mui/material";
import { Link,  useLocation } from "react-router-dom";
import imgInsights from '../../../../mystockimg/AdobeStock_123597067-scaled-2560x1280.jpeg';
import imgInvoice from '../../../../mystockimg/e-invoice.png';
import imgSales from '../../../../mystockimg/debt-equity-ratio.webp';
import imgStock from '../../../../mystockimg/tools-for-effective-inventory-management-1920x1274.jpg.webp';

const Landing = () => {
  return (
    <div >
      
      <h1 className="text-main text-center mt-5 ">poweredStock</h1>
      <h4 className="text-center mb-3 mb-2">Stop managing your stock, focus on making better sales.</h4>

      <div className="banner shadow-sm ">

        <div className=" col-12 col-lg-6 col-md-6 d-flex flex-column gap-3 justify-content-center align-items-center pt-3" style={{float: 'right'}}>
          <div style={{zIndex: 2}}>
      <h6 className="fw-bold me-2 ps-2 pe-2 fs-5 mt-1 text-white text-center" >
Whether you're a small hardware store or a large enterprise, our system can help you to
     improve your inventory management and profitability.</h6>
     </div>
     <div style={{zIndex: 2}}>
     <p className=" fs-5 ps-2 text-white text-center" >
  
  Track inventory levels in real time, Simply do stock replenishment, Set up debt payment alerts, Generate reports on inventory levels, sales, and more.
  </p>
  </div>
 
  <div style={{zIndex: 2}} className="mt-2">
  <Link className="nav-link  d-none d-lg-block d-xl-block" to="/signup"  > 
            <button type="button" className="btn mainColor btn-outline-primary rounded fw-bold shadow-sm fs-4 text-center" style={{backgroundColor: "#1C4E80"}}> 
             <span className="fw-bold text-white">Try poweredStock</span>
             </button>
             </Link>  
             </div>
             </div>
      </div>

{/* info */}
      <div className="info w-100 p-2 text-white mainColor text-center fw-bold">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-info-circle me-2" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>Books or papers get lost, damaged by liquids, burnt, misplaced. THE INTERNET DOESN'T.
      </div>

   <div className="d-flex flex-column justify-content-center ps-5 pe-5 gap-2">
{/* 1 */}
    <div>
    <div className="text-center mt-5 mb-5 bg-body-tertiary rounded p-4 shadow">
            <h4 className="text-main">Built for hardware sales people by hardware sales people...</h4>
            <p className="fs-6 mb-4">Does it fit my business? 0776033533/0703299738</p>
            {/* <p><a href="#" className="fw-bold"></a></p> */}
            <p>
            <Link className="nav-link  d-none d-lg-block d-xl-block" to="/signup" > <span className="fw-bold p-2 text-center d-flex justify-content-center align-items-center"><button type="button" className="btn btn-sm btn-dark text-white">Try powerdStock now</button></span> </Link>  
            </p>
        </div>
    </div>

{/* 2 */}
<div>
<p>
<h3>With our system, you will be able to easily perform the following</h3>
</p>
<div className="container d-md-flex d-lg-flex flex-wrap  mt-3">

    <div className="d-flex flex-column justify-content-center align-items-center col-12 col-lg-3 mt-1" 
    >
      <div>
      <Avatar   src={imgStock}
  sx={{ width: 150, height: 150}}
   />
      </div>
      <div>
      <h6 className="text-center mt-2">
      Manage your Stock and Inventory at one place
    </h6>

    </div>
  </div>

  
  <div className="d-flex flex-column justify-content-center align-items-center col-12 col-lg-3 mt-2" 
  // style={{width: "18rem"}}
  >
      <div>
      <Avatar   src={imgSales}
  sx={{ width: 150, height: 150}}
   />
      </div>
      <div>
      <h6 className="text-center mt-2">
      Easily track your Sales and manage customer Debts 
    </h6>

    </div>

  </div>

  
  <div className="d-flex flex-column justify-content-center align-items-center col-12 col-lg-3 mt-2"
  // style={{width: "18rem"}}
  >
      <div>
      <Avatar   src={imgInsights}
  sx={{ width: 150, height: 150}}
   />
      </div>
      <div>
      <h6 className="text-center mt-2">
      Get better insights and generate custom reports for your business
    </h6>

    </div>

  </div>

  
  <div className="d-flex flex-column justify-content-center align-items-center col-12 col-lg-3 mt-2" 
  // style={{width: "18rem"}}
  >
      <div>
      <Avatar   src={imgInvoice}
  sx={{ width: 150, height: 150}}
   />
      </div>
      <div>
      <h6 className="text-center mt-2">
      Quickly get in touch with your customers through our e-receipts and e-invoices
    </h6>

    </div>

  </div>

</div>
</div>

{/* 3*/}
<div className="mt-4">
  <Link className="nav-link d-none d-lg-block d-xl-block" to="/signup" >  <span className="fw-bold text-white"><button className="rounded btn-sm mainColor text-white p-2 text-center" style={{border:"none"}}>Try poweredStock now</button></span> </Link>       
</div>

{/* 4 */}
<div>
<div className="mt-5 bg-body-tertiary rounded p-4 shadow border-4" style={{borderRightStyle:"solid", borderRightWidth:"1px", borderRightColor:"#1C4E80"}}>
            <h2 className="mb-4">The benefits of effective asset stock management</h2>
            <ul>
               <li className="fs-4 text-main">Cutting costs.</li>
               <p className="fs-6">Order stock in the right quantities at the right time so that you’re never over- or under-stocked.</p>
               <li className="fs-4 text-main">Maximising labour.</li>
               <p className="fs-6">More productivity and less time wasted looking for missing items or tracking things by hand.</p>
               <li className="fs-4 text-main">Saving space</li>
               <p className="fs-6">Well-managed stock leads to more efficient and organised warehouses.</p>
               <li className="fs-4 text-main">Happier customers.</li>
               <p className="fs-6">Orders ship faster and are more accurate, leading to satisfied customers and upheld service level agreements.</p>
            </ul>
            <p>
            <Link className="nav-link  d-none d-lg-block d-xl-block" to="/signup" >  <span className="fw-bold text-white"><button className="rounded btn-sm mainColor text-white p-2 text-center" style={{border:"none"}}>Try poweredStock now</button></span> </Link> 
            </p>
        </div>
</div>

{/* 5 */}
<div>
<div className="p-4 mt-5 shadow border-end border-4 border-danger rounded">
            <h2 className="text-danger mb-3">How inefficient stock management puts you at a disadvantage</h2>
            <p className="fs-5">Stock is usually one of the largest assets a company owns, which is why stock mismanagement is one of the top reasons small businesses fail.
            Inefficient asset stock management can decrease your profitability in several ways:</p>
            <p className="fs-6 mt-4 mb-4"><b className="text-danger">Too much stock.</b>Having more stock on hand than you need can cost you. You pay for more warehouse space, which is expensive, and perishable items can spoil or expire before you’re able to sell them</p>
            <p className="fs-6 mb-4"><b className="text-danger">Longer lead time.</b>Staying ahead of the curve on retail trends helps you capitalise on the popular items customers want at the moment. If you’re slow to adapt to the changing market, however, customers will look 
            elsewhere, and you’ll surrender market share.</p>
             <p className="fs-6"><b className="text-danger">Too little stock.</b>Customers will order from somewhere else if you don’t have what they want in stock. At the very least, stockouts will cost you sales. If they happen often, you’ll lose customers.</p>
             <br/><br/>
             <p>
             <Link className="nav-link  d-none d-lg-block d-xl-block" to="/signup" >  <span className="fw-bold text-white"><button className="rounded btn-sm mainColor text-white p-2 text-center" style={{border:"none"}}>Try poweredStock now</button></span> </Link> 
            </p>
        </div>
</div>

{/* end */}
   </div>

    </div>
  );
}

export default Landing;
