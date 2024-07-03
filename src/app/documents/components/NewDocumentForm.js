import React from 'react';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InvoiceForm from '../InvoiceForm';
const NewDocumentForm = ({showNewDocModal,setshowNewDocModal}) => {
  return (
    <div>
       <Modal 
        show={showNewDocModal}
        fullscreen={true}
        onHide={() => setshowNewDocModal(false)}
        >
        <Modal.Header closeButton>
          <Modal.Title>Document Form</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InvoiceForm />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default NewDocumentForm;
