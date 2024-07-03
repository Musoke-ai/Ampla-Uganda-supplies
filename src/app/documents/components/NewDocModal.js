import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import invoiceLogo from '../../icons/document/invoice-1024.webp';
import receiptLogo from '../../icons/document/paper-receipt-icon-simple-style-vector-26801158.jpg';
import quotationLogo from '../../icons/document/quotation2.png';
import CatologLogo from '../../icons/document/catalog-logo.jpg';
import QrGenerator from '../../tools/QrGenerator';
const NewDocModal = (props) => {
  return (
    <div>
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className='fs-5' id="contained-modal-title-vcenter">
          Select Document 
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
     <div className='d-flex justify-content-center'>
        <div className='d-flex flex-column align-items-center justify-content-center'>
        <button className='btn btn-white doc-icon' width={100} height={100} style={{borderRadius:"50%"}} ><img src={receiptLogo} width={100} height={100} style={{borderRadius:"50%"}}/></button>
       <div className='fw-bold mt-1'>Receipt</div>
        </div>
        <div className='d-flex flex-column align-items-center justify-content-center'>
        <button className='btn btn-white doc-icon' width={100} height={100} style={{borderRadius:"50%"}} ><img src={quotationLogo} width={100} height={100} style={{borderRadius:"50%"}}/></button>
       <div className='fw-bold mt-1'>Quotation</div>
        </div>
        <div className='d-flex flex-column align-items-center justify-content-center'>
        <button className='btn btn-white doc-icon' onClick={()=>{
         props.setshowNewDocModal(true);
         props.onHide()
          }} width={100} height={100} style={{borderRadius:"50%"}} ><img src={invoiceLogo} width={100} height={100} style={{borderRadius:"50%"}}/></button>
       <div className='fw-bold mt-1'>Invoice</div>
        </div>
        <div className='d-flex flex-column align-items-center justify-content-center'>
        <button className='btn btn-white doc-icon' width={100} height={100} style={{borderRadius:"50%"}} ><img src={CatologLogo} width={100} height={100} style={{borderRadius:"50%"}}/></button>
       <div className='fw-bold mt-1'>Catolog</div>
        </div>
     </div>
     {/* <QrGenerator /> */}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide} className='btn btn-dark'>Close</Button>
      </Modal.Footer>
    </Modal>
    </div>
  );
}
 export default NewDocModal;
