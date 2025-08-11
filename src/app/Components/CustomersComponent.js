import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Fuse from "fuse.js";
import { useSelector } from "react-redux";
import {
  selectCustomerIds,
  selectCustomers,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from "../features/api/customers";
import { EyeFill, PencilFill, Plus, Search } from "react-bootstrap-icons";
import { Delete } from "@mui/icons-material";
import {
  Grid,
  TextField,
  IconButton,
  LinearProgress,
} from "@mui/material";
import AddCustomer from "./Models/AddCustomer";
import SalesTable from "./tables/SalesTable";
import { selectSales } from "../features/api/salesSlice";
import { selectStock } from "../features/stock/stockSlice";
import { selectDebt } from "../features/api/debtSlice";
import PermissionWrapper from "../auth/PermissionWrapper";

const CustomersPage = () => {
  const salesData = useSelector(selectSales);
  const customers = useSelector(selectCustomers);
  const inventoryData = useSelector(selectStock);
  const debts = useSelector(selectDebt);

  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  const fuse = new Fuse(customers, {
    keys: ["custName", "custContact", "custEmail", "custLocation"],
    threshold: 0.3,
  });
  const results = query ? fuse.search(query).map((res) => res.item) : customers;
  const paginatedResults = results.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [custId, setCustId] = useState("");
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custLocation, setCustLocation] = useState("");

  const [upDateCustomer, { data, isLoading }] = useUpdateCustomerMutation();
  const [DeleteCustomer, { data: deleteData, isDeleteLoading }] =
    useDeleteCustomerMutation();

  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleModalToggle = () => setShowModal(!showModal);

  const setValuesOnPress = () => {
    setCustId(selectedCustomer?.custId);
    setCustName(selectedCustomer?.custName);
    setCustContact(selectedCustomer?.custContact);
    setCustEmail(selectedCustomer?.custEmail);
    setCustLocation(selectedCustomer?.custLocation);
  };

  const resetFields = () => {
    selectCustomerIds("");
    setCustName("");
    setCustContact("");
    setCustEmail("");
    setCustLocation("");
    setSelectedCustomer(null);
  };

  useEffect(() => {
    if (selectedCustomer) setValuesOnPress();
  }, [selectedCustomer]);

  const canUpdate =
    custName !== selectedCustomer?.custName ||
    custContact !== selectedCustomer?.custContact ||
    custEmail !== selectedCustomer?.custEmail ||
    custLocation !== selectedCustomer?.custLocation;

  const handleUpdateCustomer = async () => {
    if (custName && custContact && custEmail && custLocation && custId) {
      try {
        await upDateCustomer({
          cust_id: custId,
          cust_name: custName,
          cust_contact: custContact,
          cust_email: custEmail,
          cust_location: custLocation,
        }).unwrap();
        resetFields();
      } catch (err) {
        console.log("Error: " + err);
      } finally {
        setMessage(data);
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (custId) {
      try {
        await DeleteCustomer({ cust_id: selectedCustomer?.custId }).unwrap();
        setSelectedCustomer(null);
      } catch (err) {
        console.log("Error: " + err);
      } finally {
        setMessage(deleteData);
      }
    }
  };

  const countCustomerSales = (custId) =>
    salesData?.filter((sale) => Number(sale.custId) === Number(custId)).length;

  const countCustomerDebts = (custId) =>
    debts?.filter((debt) => Number(debt.custId) === Number(custId)).length;

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 10, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Contact", "Email", "Location"]],
      body: customers.map((c) => [
        c.custName,
        c.custContact,
        c.custEmail,
        c.custLocation,
      ]),
    });
    doc.save("customers.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(customers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  const totalPages = Math.ceil(results.length / customersPerPage);

  return (
    <div className="container mt-4">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Customers</h1>
        <PermissionWrapper required={['export']} children={
<div>
          <Button className="me-2" onClick={handlePrintPDF} variant="success">
            Export PDF
          </Button>
          <Button className="me-2" onClick={handleExportExcel} variant="info">
            Export Excel
          </Button>
          <Button variant="primary" onClick={handleModalToggle}>
            <Plus size={25} />
          </Button>
        </div>
        } />
        
      </div>

      <Grid item xs={12} sm={4} mt={4}>
        <TextField
          label="Search Customer"
          variant="outlined"
          fullWidth
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton>
                <Search />
              </IconButton>
            ),
          }}
        />
      </Grid>

      <Table striped bordered hover className="mt-4">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Location</th>
            <th>Sales</th>
            <th>Debts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedResults?.map((customer, index) => (
            <tr key={customer.custId}>
              <td>{(currentPage - 1) * customersPerPage + index + 1}</td>
              <td>{customer.custName}</td>
              <td>{customer.custContact}</td>
              <td>{customer.custEmail}</td>
              <td>{customer.custLocation}</td>
              <td>{countCustomerSales(customer.custId)}</td>
              <td>{countCustomerDebts(customer.custId)}</td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowTransactionsModal(true);
                  }}
                >
                  <EyeFill />
                </Button>{" "}
                <PermissionWrapper required={['edit']} children={
<Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowEditModal(true);
                  }}
                >
                  <PencilFill />
                </Button>
                } />
                
                {" "}
                <PermissionWrapper required={['delete']} children={
<Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowDeleteModal(true);
                  }}
                >
                  <Delete />
                </Button>
                } />
                
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div>
          <Button
            variant="outline-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>{" "}
          <Button
            variant="outline-secondary"
            onClick={() =>
              setCurrentPage((prev) =>
                prev < totalPages ? prev + 1 : totalPages
              )
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <AddCustomer showModal={showModal} handleModalToggle={handleModalToggle} />

      {/* Transactions, Edit, Delete modals go here - unchanged */}
    </div>
  );
};

export default CustomersPage;
