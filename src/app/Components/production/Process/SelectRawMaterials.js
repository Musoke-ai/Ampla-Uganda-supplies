import React, { useState } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
} from "react-bootstrap";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { selectRawMaterials } from "../../../features/api/rawmaterialsSlice";
import { selectRawMaterialsIntake, useAddRawMaterialListMutation, useUpdateRawMaterialListMutation, useDeleteRawMaterialListMutation } from "../../../features/api/rawmaterialsIntakeSlice";

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getTodayDate = () => format(new Date(), "yyyy-MM-dd");

const handleApiError = (error) => {
  const status = error?.status || 'unknown';
  const message = error?.data?.message;

  let toastMessage = `An unexpected error occurred: ${message || 'Unknown error'}`;

  switch (status) {
      case 400:
          toastMessage = message || 'Bad request. Please check your input.';
          break;
      case 401:
          toastMessage = message || 'Unauthorized. Please log in.';
          break;
      case 404:
          toastMessage = message || 'Resource not found.';
          break;
      case 500:
          toastMessage = message || 'Server error. Please try again later.';
          break;
  }
  toast.error(toastMessage, { autoClose: 4000 });
};
const RawMaterialModal = () => {

  const [showModal, setShowModal] = useState(false);

  const today = getTodayDate();

  const [addList, {data: addData, isLoading, isError, error, isSuccess}] = useAddRawMaterialListMutation();
  const [updateList, {data:updateData, isLoading: isUpdateLoading, isError: isUpdateError, error:updateError, isSuccess: isUpdateSuccess}] = useUpdateRawMaterialListMutation();
  const [deleteItem, {data:deleteResponse, isLoading: isDeleteLoading, isError: isDeleteError, error:deleteError, isSuccess: isDeleteSuccess}] = useDeleteRawMaterialListMutation();

  const rawMaterials = useSelector(selectRawMaterials);
  const rawMaterialsList = useSelector(selectRawMaterialsIntake);

  const todayListIds = rawMaterialsList.filter(
    (e) =>
      format(new Date(e.dailyRawmaterialsDateCreated), "yyyy-MM-dd") === today
  ).map(e=>e.materialId);

  const filteredRawMaterials =  rawMaterials.filter(
      (e) => !todayListIds.includes(e.materialId)
    );

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItemDetails, setDeleteItemDetails] = useState({id: "", materialId: ""});

  const handleCloseDeleteModal = () => {
    setDeleteItemDetails({id: "", materialId: ""});
    setShowDeleteModal(false);
  }

  const [form, setForm] = useState({
    id: null,
    materialId: "",
    quantity: 1,
    totalCost:"",
    initials: "",
  });
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleClose = () => setShowModal(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      id: null,
      materialId: "",
      quantity: 1,
      totalCost:"",
      initials: "",
    });
    setEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if(editing){
        const updateResponse = await updateList({...form}).unwrap();
        toast.success(updateResponse?.message || "Item updated successfully!", { autoClose: 5000 });
        resetForm();
        handleClose();
      }else{
        const addResponse = await addList({...form}).unwrap();
        toast.success(addResponse?.message || "Item added successfully!", { autoClose: 5000 });
        resetForm();
        return;
      }
    }
    catch (error) {
      const status = error?.status || 500;

      if (status === 400) {
        toast.error("Bad request. Please check your input.", { autoClose: 4000 });
      } else if (status === 401) {
        toast.warning("Unauthorized. Please log in.", { autoClose: 4000 });
      } else if (status === 404) {
        toast.error("Resource not found.", { autoClose: 4000 });
      } else if (status === 500) {
        toast.error("Server error. Please try again later.", { autoClose: 4000 });
      } else {
        toast.error(`Unexpected error (${status}).`, { autoClose: 4000 });
      }
    }
  };

  const handleEdit = (entry) => {
    setForm(entry);
    setEditing(true);
  };

  const handleDelete = async() => {
    try {
    
        const deleteResponse = await deleteItem({id: deleteItemDetails?.id, materialId: deleteItemDetails?.materialId}).unwrap();
        setShowDeleteModal(false);
        setDeleteItemDetails({id:"", materialId:""});
        toast.success(deleteResponse?.message || "Item deleted successfully!", { autoClose: 5000 });
    } catch (error) { handleApiError(error); }
  };

  const filteredEntries = showAll
    ? rawMaterialsList
    : rawMaterialsList.filter(
        (e) =>
          format(new Date(e.dailyRawmaterialsDateCreated), "yyyy-MM-dd") === today 
      );

  const getMaterialName = (id) =>
    rawMaterials.find((m) => m.materialId === id)?.name || "Unknown";

  return (
    <div>
      <Button onClick={() => setShowModal(true)}>
        Daily List
      </Button>
    <Modal show={showModal} onHide={handleClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Daily Raw Material Intake</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form className="mb-4">
          <div className="d-flex flex-wrap gap-3">
            <Form.Group style={{ minWidth: 200 }}>
              <Form.Label>Material</Form.Label>
              <Form.Select
  name="materialId"
  value={form.materialId}
  onChange={handleChange}
  style={{ height: "40px" }}
>
  <option value="">-- Select --</option>
  {filteredRawMaterials.map((material) => (
    <option key={material.materialId} value={material.materialId}>
      {material.name}
    </option>
  ))}
</Form.Select>
            </Form.Group>

            <Form.Group style={{ minWidth: 150 }}>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group style={{ minWidth: 150 }}>
              <Form.Label>Initials</Form.Label>
              <Form.Control
                type="text"
                name="initials"
                value={form.initials}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex align-items-end">
              {editing?isUpdateLoading?<Button variant="primary">
                Updating
              </Button>:
              <Button variant="primary" onClick={handleSubmit}>
                Update
              </Button>:isLoading?<Button variant="primary">
                Saving
              </Button>:
              <Button variant="primary" onClick={handleSubmit}>
                Add
              </Button>}
            </div>
          </div>
        </Form>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5>{showAll ? "All Records" : "Today's Records"}</h5>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Today Only" : "Show All"}
          </Button>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Material</th>
              <th>Quantity</th>
              <th>Total Cost</th>
              <th>Initials</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries?.map((entry, index) => (
              <tr key={entry.id}>
                <td>{index + 1}</td>
                <td>{getMaterialName(entry.materialId)}</td>
                <td>{entry.quantity}</td>
                <td>{entry.totalCost}</td>
                <td>{entry.initials}</td>
                <td>{format(new Date(entry.dailyRawmaterialsDateCreated), "yyyy-MM-dd")}</td>
                <td>
                {
                  format(new Date(entry.dailyRawmaterialsDateCreated), "yyyy-MM-dd") === today? <div><Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(entry)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {setDeleteItemDetails({id:entry.id,materialId:entry.materialId});setShowDeleteModal(true)}}
                >
                  Delete
                </Button> </div>:<div> <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    disabled
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled
                  >
                    Delete
                  </Button>
                  </div>
                }
                 
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
    <Modal.Header>Delete Alert</Modal.Header>
    <Modal.Body><div className="text-danger fs-5 fw-bold">You are about to delete an item from the list!</div></Modal.Body>
    <Modal.Footer>
    <Button onClick={()=>setShowDeleteModal(false)}>Cancel</Button>
   {
   isDeleteLoading?
   <Button className="btn btn-info">Deleting...</Button>:
   <Button className="btn btn-danger" onClick={handleDelete}>Delete</Button>
   }
    </Modal.Footer>
    </Modal>
    </div>
  );
};

export default RawMaterialModal;
