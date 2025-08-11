import React, { useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  InputGroup,
  Dropdown,
  Badge,
} from "react-bootstrap";
import { toast } from 'react-toastify';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import { useSettings } from "../Settings";

//Get data from the store using the selectors
import { useSelector } from "react-redux";
import {
  selectStock,
  useAddStockMutation,
  useDeleteStockMutation,
  useUpdateStockMutation,
} from "../../features/stock/stockSlice";
import PermissionWrapper from "../../auth/PermissionWrapper";

const initialFormState = {
  itemId: null,
  itemName: "",
  itemCategoryId: "1",
  itemModel: "",
  itemQuality: "New",
  itemQuantity: "",
  itemCondition: "Good",
  itemSize: "",
  itemStockPrice: "",
  itemLeastPrice: "",
  itemNotes: "",
  itemOwner: "",
};

// --- Helper Functions ---
const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;

// --- Main App Component ---
export default function InventoryPage() {

const { settings } = useSettings();

  const inventory = useSelector(selectStock);
  const [createInventory, { isloading, isSuccess, isError, Error }] =
    useAddStockMutation();
  const [
    deleteInventory,
    {
      isloading: isDeleteLoading,
      isSuccess: isDeleteSuccess,
      isError: isDeleteError,
      Error: deleteError,
    },
  ] = useDeleteStockMutation();
  const [
    updateInventory,
    {
      isloading: isUpdateLoading,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      Error: updateError,
    },
  ] = useUpdateStockMutation();
  // --- State Management ---
  // const [inventory, setInventory] = useState(initialInventory);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(initialFormState);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "itemName",
    direction: "ascending",
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // --- Data Processing (Filtering, Sorting, Pagination) ---
  const processedInventory = useMemo(() => {
    let sortableItems = [...inventory];
    if (filter) {
      sortableItems = sortableItems.filter(
        (item) =>
          item.itemName.toLowerCase().includes(filter.toLowerCase()) ||
          item.itemModel.toLowerCase().includes(filter.toLowerCase())
      );
    }
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    if (rowsPerPage !== "All") {
      return sortableItems.slice(0, rowsPerPage);
    }
    return sortableItems;
  }, [inventory, filter, sortConfig, rowsPerPage]);

  // --- Modal Handling ---
  const handleShowFormModal = (item) => {
    setCurrentItem(item ? { ...item } : initialFormState);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setCurrentItem(initialFormState);
  };

  const handleShowDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleAddItem = async (itemData) => {
     if (itemData.itemId) { // Update
             try {
      await updateInventory({
        itemId: itemData.itemId,
        item_name: itemData.itemName,
        item_category: itemData.itemCategoryId,
        item_model: itemData.itemModel,
        item_quality: itemData.itemQuality,
        item_quantity: itemData.itemQuantity,
        item_condition: itemData.itemCondition,
        item_size: itemData.itemSize,
        item_min_price: itemData.itemLeastPrice,
        item_notes: itemData.itemNotes,
        item_owner: itemData.itemOwner,
        item_stock_price: itemData.itemStockPrice,
      }).unwrap();
      toast.success('Item updated successfully!');
    //   setCurrentItem(initialFormState);
    } catch (err) {
        console.log('Error: ',err);
        toast.error(err);
    }

      } else { // Create
        try {
      await createInventory({
        item_name: itemData.itemName,
        item_category: itemData.itemCategoryId,
        item_model: itemData.itemModel,
        item_quality: itemData.itemQuality,
        item_quantity: itemData.itemQuantity,
        item_condition: itemData.itemCondition,
        item_size: itemData.itemSize,
        item_min_price: itemData.itemLeastPrice,
        item_notes: itemData.itemNotes,
        item_owner: itemData.itemOwner,
        item_stock_price: itemData.itemStockPrice,
      }).unwrap();
      setCurrentItem(initialFormState);
      toast.success('Item added successfully!');
    } catch (err) {
        console.log('Error: ',err);
        toast.error(err);
    }
    
  }
};

  const handleDeleteItem = async () => {
    if (itemToDelete) {

         try {
       const data = await deleteInventory({
        itemId: itemToDelete.itemId
       }).unwrap();
       toast.success('Item deleted successfully!');
       handleCloseDeleteModal();

     } catch (err) {
        console.log("Error: ",err);
        toast.error(err);
     }

    //   setInventory(
    //     inventory.filter((item) => item.itemId !== itemToDelete.itemId)
    //   );
    //   handleCloseDeleteModal();
    }
  };

  // --- Sorting ---
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="bi bi-arrow-down-up"></i>;
    }
    if (sortConfig.direction === "ascending") {
      return <i className="bi bi-arrow-up"></i>;
    }
    return <i className="bi bi-arrow-down"></i>;
  };

  // --- Exporting ---
  const exportToCSV = () => {
    if (processedInventory.length === 0) return;
    const headers = Object.keys(processedInventory[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      processedInventory
        .map((item) =>
          headers
            .map((header) => {
              let cell = item[header];
              if (typeof cell === "string" && cell.includes(",")) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            })
            .join(",")
        )
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory List", 14, 15);
    doc.autoTable({
      startY: 20,
      head: [
        [
          "#",
          "Item Name",
          "Model",
          "Qty",
          "Stock Price",
          "Least Price",
          "Condition",
          "Quality",
        ],
      ],
      body: processedInventory.map((item, index) => [
        index + 1,
        item.itemName,
        item.itemModel,
        item.itemQuantity,
        formatCurrency(item.itemStockPrice),
        formatCurrency(item.itemLeastPrice),
        item.itemCondition,
        item.itemQuality,
      ]),
    });
    doc.save("inventory.pdf");
  };

  // --- Totals Calculation ---
  const totals = useMemo(() => {
    return {
      quantity: processedInventory.reduce(
        (sum, item) => sum + (Number(item.itemQuantity) || 0),
        0
      ),
      stockValue: processedInventory.reduce(
        (sum, item) =>
          sum + (Number(item.itemQuantity) || 0) * (Number(item.itemStockPrice) || 0),
        0
      ),
      leastValue: processedInventory.reduce(
        (sum, item) =>
          sum + (Number(item.itemQuantity) || 0) * (Number(item.itemLeastPrice) || 0),
        0
      ),
    };
  }, [processedInventory]);

  return (
    <Container fluid className="p-4" style={{ backgroundColor: settings.theme==='dark'?"#1A202C":"#ffffff" }}>
      {/* Header */}
      <header className="mb-4">
        <Row className="align-items-center mb-3">
          <Col className="mb-3 mt-1">
            <h3 className="h2 mb-0">Inventory Management</h3>
            <p className="text-muted">
              {/* Sort, filter, export, and manage your inventory. */}
            </p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
                <i className="bi bi-box-arrow-up me-2"></i>Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToCSV}>
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i>Export
                  to CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>Export to PDF
                </Dropdown.Item>
                <Dropdown.Item onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>Print
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <PermissionWrapper required={['productscreate']}
            children={
               <Button variant="primary" onClick={() => handleShowFormModal(null)}>
              <i className="bi bi-plus-circle me-2"></i>Add New Item
            </Button>
            }
            />

          </Col>
        </Row>
      </header>

      {/* Main Content */}
      <main>
        <div className={`p-4 rounded shadow-sm mt-5 border ${settings.theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
          <Row className="mb-3 align-items-center">
            <Col md>
              <h2 className="h5 mb-md-0">Inventory List</h2>
            </Col>
            <Col md="auto" className="d-flex gap-2">
              <Dropdown
                onSelect={(e) =>
                  setRowsPerPage(e === "All" ? "All" : Number(e))
                }
              >
                <Dropdown.Toggle variant="outline-secondary" id="rows-per-page">
                  Show: {rowsPerPage}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="5">5</Dropdown.Item>
                  <Dropdown.Item eventKey="10">10</Dropdown.Item>
                  <Dropdown.Item eventKey="25">25</Dropdown.Item>
                  <Dropdown.Item eventKey="All">All</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter by Name or Model..."
                  onChange={(e) => setFilter(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
          <Table responsive hover>
            <thead className={`${settings.theme === 'dark'?'table-dark': 'table-light'}`} >
            {/* <thead className="table-light"> */}
              <tr>
                <th>#</th>
                <th
                  onClick={() => requestSort("itemName")}
                  style={{ cursor: "pointer" }}
                >
                  Item Name {getSortIcon("itemName")}
                </th>
                <th
                  onClick={() => requestSort("itemModel")}
                  style={{ cursor: "pointer" }}
                >
                  Model {getSortIcon("itemModel")}
                </th>
                <th
                  onClick={() => requestSort("itemQuantity")}
                  style={{ cursor: "pointer" }}
                >
                  Qty {getSortIcon("itemQuantity")}
                </th>
                <th
                  onClick={() => requestSort("itemStockPrice")}
                  style={{ cursor: "pointer" }}
                >
                  Stock Price {getSortIcon("itemStockPrice")}
                </th>
                <th
                  onClick={() => requestSort("itemLeastPrice")}
                  style={{ cursor: "pointer" }}
                >
                  Least Price {getSortIcon("itemLeastPrice")}
                </th>
                <th
                  onClick={() => requestSort("itemCondition")}
                  style={{ cursor: "pointer" }}
                >
                  Condition {getSortIcon("itemCondition")}
                </th>
                <th
                  onClick={() => requestSort("itemQuality")}
                  style={{ cursor: "pointer" }}
                >
                  Quality {getSortIcon("itemQuality")}
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedInventory.map((item, index) => (
                <tr key={item.itemId}>
                  <td>{index + 1}</td>
                  <td>{item.itemName}</td>
                  <td>{item.itemModel}</td>
                  <td>{item.itemQuantity}</td>
                  <td>{formatCurrency(item.itemStockPrice)}</td>
                  <td>{formatCurrency(item.itemLeastPrice)}</td>
                  <td>
                    <Badge
                      bg={item.itemCondition === "Good" ? "success" : "warning"}
                    >
                      {item.itemCondition}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={item.itemQuality === "New" ? "info" : "secondary"}
                    >
                      {item.itemQuality}
                    </Badge>
                  </td>
                  <td className="text-center">
                       <PermissionWrapper required={['productsupdate']}
            children={
           <Button
                      variant={settings.theme==='dark'?'dark':'light'}
                      // variant="light"
                      className="btn-icon rounded-circle me-2"
                      onClick={() => handleShowFormModal(item)}
                      title="Edit"
                    >
                      {/* <i className="bi bi-pencil-square text-primary"></i> */}
                      <PencilSquare className="text-primary" />
                    </Button>
            }
            />
                   
                                   <PermissionWrapper required={['productsdelete']}
            children={
            <Button
                      variant="light"
                      className="btn-icon rounded-circle"
                      onClick={() => handleShowDeleteModal(item)}
                      title="Delete"
                    >
                      {/* <i className="bi bi-trash text-danger"></i> */}
                      <Trash className="text-danger" />
                    </Button>
            }
            />

                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {processedInventory.length === 0 && (
            <p className="text-center text-muted mt-4">
              No items match your criteria.
            </p>
          )}
          <div className="pt-3 mt-3 border-top d-flex justify-content-end gap-4">
            <div className="text-end">
              <small className="text-muted">Total Quantity</small>
              <p className="fw-bold h5 mb-0">{totals.quantity}</p>
            </div>
            <div className="text-end">
              <small className="text-muted">Total Stock Value</small>
              <p className="fw-bold h5 mb-0">
                {formatCurrency(totals.stockValue)}
              </p>
            </div>
            <div className="text-end">
              <small className="text-muted">Total Least Value</small>
              <p className="fw-bold h5 mb-0">
                {formatCurrency(totals.leastValue)}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      <Modal
        show={showFormModal}
        onHide={handleCloseFormModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentItem.itemId ? "Edit Item" : "Add New Item"}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem(currentItem);
          }}
        >
          <Modal.Body
            style={{ maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}
          >
            <fieldset className="border p-3 mb-3">
              <legend className="w-auto px-2 h6">Core Details</legend>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter item name"
                      required
                      value={currentItem.itemName || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          itemName: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Model / SKU</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter item model"
                      required
                      value={currentItem.itemModel || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          itemModel: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            <fieldset className="border p-3 mb-3">
              <legend className="w-auto px-2 h6">Stock & Pricing</legend>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      required
                      value={currentItem.itemQuantity || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          itemQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Price</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        required
                        value={currentItem.itemStockPrice || ""}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            itemStockPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Least Price</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        required
                        value={currentItem.itemLeastPrice || ""}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            itemLeastPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            <fieldset className="border p-3">
              <legend className="w-auto px-2 h6">Attributes</legend>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 12oz"
                      value={currentItem.itemSize || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          itemSize: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add any relevant notes..."
                      value={currentItem.itemNotes || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          itemNotes: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseFormModal}>
              Cancel
            </Button>
          { 
          isloading? <Button variant="primary" >
              {currentItem.itemId ? "Updating Item" : "Saving Item"}
            </Button>:<Button variant="primary" type="submit">
              {currentItem.itemId ? "Update Item" : "Save Item"}
            </Button>}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the item:{" "}
          <strong>{itemToDelete?.itemName}</strong>? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          {isDeleteLoading?<Button variant="danger" >
            Deleting Item...
          </Button>:<Button variant="danger" onClick={handleDeleteItem}>
            Delete Item
          </Button>}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
