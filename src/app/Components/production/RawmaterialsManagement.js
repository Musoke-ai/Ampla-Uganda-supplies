import React, { useRef, useState } from "react";
import { Table, Button, Modal, Form, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import { selectRawMaterials, useAddRawMaterialMutation, useUpdateRawMaterialMutation, useDeleteRawMaterialMutation } from "../../features/api/rawmaterialsSlice";
import ReactLoading from 'react-loading';
import RawMaterialModal from "./Process/SelectRawMaterials";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { Delete, Edit } from "@mui/icons-material";
import { useSettings } from "../Settings";
import { toast } from "react-toastify";

const RawMaterialsTable = () => {
const { settings } = useSettings();
const currency = settings.currency!=="none"?settings?.currency:"";

    const rawMaterials = useSelector(selectRawMaterials);
    const [addRawMaterial, {isLoading, isError, error, isSuccess} ]= useAddRawMaterialMutation();
    const [updateRawMaterial, {isLoading:isUpdateLoading, isError: isUpdateError, error:updateError, isSuccess:isUpdateSuccess} ]= useUpdateRawMaterialMutation();
    const [deleteRawMaterial, {isLoading:isDeleteLoading, isError: isDeleteError, error:deleteError, isSuccess:isDeleteSuccess} ]= useDeleteRawMaterialMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlertModal, setShowDeleteAlertModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [materialId, setMaterialId] = useState("");

  const [formData, setFormData] = useState({
    name: "", size: "", Quantity: "", unitPrice: "", supplier: "", note: "", expiry: ""
  });

  const handleShowEdit = (material) => {
    setSelectedMaterial(material);
    setFormData(material);
    setShowEditModal(true);
  };

  const handleAdd = async () => {
    try{
        const data = await addRawMaterial(
           {...formData}
        ).unwrap();
        toast.success("Raw material added successfully");
        setFormData({
    name: "", size: "", Quantity: "", unitPrice: "", supplier: "", note: "", expiry: ""
  })
        setShowAddModal(false)
    }catch (error){
      toast.error("An error occured! "+error.status);
    }
  };

  const handleEdit = async () => {
    try{
        const data = await updateRawMaterial(
           {...formData}
        ).unwrap();
        toast.success("Raw material updated successfully");
                setFormData({
    name: "", size: "", Quantity: "", unitPrice: "", supplier: "", note: "", expiry: ""
  })
        setShowEditModal(false);
         setSelectedMaterial(null);
    }catch (error){
toast.error("An error occured! "+error.status);
    }
    // setFormData({});
  };

  const handleDelete = async (id) => {
    try{
        const data = await deleteRawMaterial(
           {materialId: id}
        ).unwrap();
        toast.success("Raw material deleted successfully");
        setShowDeleteAlertModal(false);
        setSelectedMaterial(null);
        setMaterialId("");  
    }catch (error){
toast.error("An error occured! "+error.status);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Raw Materials</h2>
      <div className="d-flex justify-content-between">
        <PermissionWrapper required={['rawcreate']} children={
          <>
  <div>
          <Button variant="primary" className="mb-3" onClick={() => setShowAddModal(true)}>
        Add New Raw Material
      </Button>
      </div>
      
      <div className="mb-3">
        <RawMaterialModal />
        </div>
          </>
        } />
      
      
      </div>
      
      <Table striped bordered hover responsive className="table-sm shadow-sm">
        <thead className="table-dark">
          <tr>
           <th>#</th>
           <th>Raw Material</th>
           <th>Size</th>
           <th>Stock onHand</th>
           <th>Unit Price</th>
           <th>Supplier</th>
           <th>Note</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rawMaterials.map((material, idx) => (
            <tr key={material.id}>
             <td>{idx+1}</td>
             <td>{material.name}</td>
             <td>{material.size}</td>
             <td>{material.Quantity}</td>
             <td>{currency}{material.unitPrice}</td>
             <td>{material.supplier}</td>
             <td>{material.note}</td>
              <td className="text-center">
              <PermissionWrapper  required={['rawupdate']} children={<Button variant="info" size="sm" className="me-2 text-white" onClick={() => handleShowEdit(material)}><Edit /></Button>}/>
              <PermissionWrapper  required={['rawdelete']} children={ <Button variant="danger" size="sm" className="me-2 text-white" onClick={() =>{ setMaterialId(material.materialId);setShowDeleteAlertModal(true);}} ><Delete /></Button>}/>
              </td>
            </tr>
          ))}
          <tr >
            <td className="fs-5 fw-bold"  colSpan={2}>Total:</td>
            <td className="fs-5 fw-bold" >{rawMaterials.reduce((prev, curr)  => prev+Number(curr.Quantity) || 0, 0 )}</td>
            <td className="fs-5 fw-bold"  >{currency}{rawMaterials.reduce((prev, curr)  => prev+Number(curr.unitPrice) || 0, 0 )}</td>
          </tr>
        </tbody>
      </Table>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Raw Material</Modal.Title>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form>
            {Object.keys(formData).map((key) => (
              <Form.Group key={key} className="mb-3">
                <Form.Label>{key.charAt(0).toUpperCase() + key.slice(1) }</Form.Label>
                <Form.Control type={ key === 'expiry' ? 'date' : key === 'Quantity' ? 'number' : 'text' } value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
              </Form.Group>
            ))}
          </Form>
          {isSuccess?<div className="bg-success fw-bold text-white p-2">Raw material added successfully</div>:""}
          {isError?<div className="bg-danger fw-bold text-white p-2">An error occured! {error}</div>:""}
        </Modal.Body>
        <Modal.Footer>
       
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Close</Button>
          {
        isLoading? <Button variant="primary" ><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  />Adding</Button>:<Button variant="primary" onClick={handleAdd}>Add</Button>
        }
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Raw Material</Modal.Title>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form>
            {Object.keys(formData).filter(key => key !== 'materialId' && key !=="rawMaterialDateCreated" && key !=="rawMaterialDateUpdated"&& key !=="rawMaterialDateDeleted").map((key) => (
              <Form.Group key={key} className="mb-3">
                <Form.Label>{key}</Form.Label>
                <Form.Control type={ key === 'expiry' ? 'date' : key === 'Quantity' ? 'number' : 'text' } value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
              </Form.Group>
            ))}
          </Form>
          {isUpdateSuccess?<div className="bg-success fw-bold text-white p-2">Raw material updated successfully</div>:""}
          {isUpdateError?<div className="bg-danger fw-bold text-white p-2">An error occured! {updateError}</div>:""}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
          {
            isUpdateLoading?<Button variant="primary" ><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>updating</Button>:<Button variant="primary" onClick={handleEdit}>Save Changes</Button>
          }
          
        </Modal.Footer>
      </Modal>

       {/* delete alert Modal */}
        <Modal show={showDeleteAlertModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Alert</Modal.Title>
        </Modal.Header>
       <div>You are about to delete this item completely from the inventory! </div>
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
    </Container>
  );
};

export default RawMaterialsTable;
