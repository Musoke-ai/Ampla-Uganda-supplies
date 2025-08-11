import React from "react";
import { Modal } from "react-bootstrap";

const Alerts = ({ isDeleteSuccess, isDeleteError, isDeleteLoading, deleteError, showDeleteAlertModal, setShowDeleteAlertModal, action }) => {
  return (
    <div>
      <Modal show={showDeleteAlertModal} onHide={() => setShowDeleteAlertModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Alert</Modal.Title>
          </Modal.Header>
         <div className="text-danger">You are about to permanently delete this item! </div>
          <Modal.Body>
            {isDeleteSuccess?<div className="bg-success fw-bold text-white p-2">Item deleted successfully</div>:""}
            {isDeleteError?<div className="bg-danger fw-bold text-white p-2">An error occured! {deleteError}</div>:""}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteAlertModal(false)}>Close</Button>
            {
              isDeleteLoading?<Button variant="primary" ><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>deleting</Button>: <Button variant="danger" size="sm" onClick={() => handleDelete(materialId)} >Delete</Button>
            }
            
          </Modal.Footer>
        </Modal>
        </div>
  );
};

export default Alerts;
