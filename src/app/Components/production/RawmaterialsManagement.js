import React, { useMemo, useState } from "react";
import { Table, Button, Modal, Form, Container, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import { selectRawMaterials, useAddRawMaterialMutation, useUpdateRawMaterialMutation, useDeleteRawMaterialMutation } from "../../features/api/rawmaterialsSlice";
import ReactLoading from 'react-loading';
import RawMaterialModal from "./Process/SelectRawMaterials";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { Delete, Edit, Search } from "@mui/icons-material";
import { useSettings } from "../Settings";
import { toast } from "react-toastify";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";
import { ArrowUp, ArrowDown } from "react-bootstrap-icons";

const searchableFields = ['name', 'size', 'supplier', 'note'];

const RawMaterialsTable = () => {
const { settings } = useSettings();
const currency = settings.currency!=="none"?settings?.currency:"";
const theme = settings.theme;

    const rawMaterials = useSelector(selectRawMaterials);
    const [addRawMaterial, {isLoading, isError, error, isSuccess} ]= useAddRawMaterialMutation();
    const [updateRawMaterial, {isLoading:isUpdateLoading, isError: isUpdateError, error:updateError, isSuccess:isUpdateSuccess} ]= useUpdateRawMaterialMutation();
    const [deleteRawMaterial, {isLoading:isDeleteLoading, isError: isDeleteError, error:deleteError, isSuccess:isDeleteSuccess} ]= useDeleteRawMaterialMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlertModal, setShowDeleteAlertModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [materialId, setMaterialId] = useState("");

  const { items: sortedMaterials, requestSort, sortConfig, setSearchTerm, searchTerm } = useTableSortSearch(rawMaterials, searchableFields);

  const [formData, setFormData] = useState({
    name: "", size: "", Quantity: "", unitPrice: "", supplier: "", note: "", expiry: ""
  });

  const handleShowEdit = (material) => {
    setSelectedMaterial(material);
    setFormData(material);
    setShowEditModal(true);
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp />;
    }
    return <ArrowDown />;
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
      <div className="d-flex justify-content-between mb-3">
      <div>
 <InputGroup style={{ maxWidth: "400px" }}>
          <InputGroup.Text className={`${theme==='dark'?'text-white':'text-dark'}`}><Search /></InputGroup.Text>
          <Form.Control
            placeholder="Search by name, size, supplier, or note"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>
       <PermissionWrapper required={['rawcreate']}>
        <div className="d-flex justify-content-between">
          <div><RawMaterialModal /> </div>
          <div><Button variant="primary" onClick={() => setShowAddModal(true)} className="ms-2">
                Add New Raw Material
              </Button></div>
        </div>
        </PermissionWrapper>
      </div>
      
      <Table striped bordered hover responsive className="table-sm shadow-sm">
        <thead className="table-dark">
          <tr>
           <th>#</th>
            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
              Raw Material {getSortIcon('name')}
            </th>
            <th onClick={() => requestSort('size')} style={{ cursor: 'pointer' }}>
              Size {getSortIcon('size')}
            </th>
            <th onClick={() => requestSort('Quantity')} style={{ cursor: 'pointer' }}>
              Stock onHand {getSortIcon('Quantity')}
            </th>
            <th onClick={() => requestSort('unitPrice')} style={{ cursor: 'pointer' }}>
              Unit Price {getSortIcon('unitPrice')}
            </th>
            <th onClick={() => requestSort('supplier')} style={{ cursor: 'pointer' }}>
              Supplier {getSortIcon('supplier')}
            </th>
            <th onClick={() => requestSort('note')} style={{ cursor: 'pointer' }}>
              Note {getSortIcon('note')}
            </th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedMaterials.map((material, idx) => (
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
            <td className="fs-5 fw-bold" >{sortedMaterials.reduce((total, item) => total + (Number(item.Quantity) || 0), 0)}</td>
            <td className="fs-5 fw-bold"  >{currency}{sortedMaterials.reduce((total, item) => total + (Number(item.unitPrice) || 0), 0).toFixed(2)}</td>
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
