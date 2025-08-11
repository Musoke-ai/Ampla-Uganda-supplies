import React, { useState, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  InputGroup,
  FormControl,
  Card,
  Alert,
} from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useSelector } from 'react-redux';
import { selectStock } from '../features/stock/stockSlice';
import {
  useAddStokMutation,
  useGetStokQuery,
  selectStok,
} from "../features/api/stockSlice";

const initialProducts = [
  { id: 1, name: 'Product A' },
  { id: 2, name: 'Product B' },
  { id: 3, name: 'Product C' },
  { id: 4, name: 'Product D' },
  { id: 5, name: 'Product E' },
];

const StockEntry = () => {

  const [addStock, { isLoading, isSuccess, isError, error }] = useAddStokMutation();
  const products = useSelector(selectStock);
  // const [products] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockItems, setStockItems] = useState([]);
  const [notes, setNotes] = useState('');
  // const [isError, setError] = useState('');

  const componentRef = useRef();

  const handleAddStockItem = (product) => {
    if (!stockItems.some((item) => item.itemId === product.itemId)) {
      setStockItems([...stockItems, { ...product, stockItemQuantity: 1, oldStock:product.itemQuantity,stockItem:product.itemId }]);
      // setError('');
    }
  };

  const handleRemoveStockItem = (productId) => {
    setStockItems(stockItems.filter((item) => item.itemId !== productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    const updatedStockItems = stockItems.map((item) =>
      item.itemId === productId ? { ...item, stockItemQuantity: quantity } : item
    );
    setStockItems(updatedStockItems);
  };

  const filteredProducts = products.filter((product) =>
    product.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleExportPDF = () => {
    if (!notes.trim()) {
      // setError('Notes are required before exporting.');
      return;
    }

    const doc = new jsPDF();
    doc.text('Daily Stock Entry', 20, 10);
    doc.autoTable({
      head: [['ID', 'Product Name', 'Produced Quantity']],
      body: stockItems.map(item => [item.itemId, item.itemName, item.itemQuantity]),
    });
    doc.text('Notes:', 20, doc.autoTable.previous.finalY + 10);
    doc.text(notes, 20, doc.autoTable.previous.finalY + 20);
    doc.save('stock-entry.pdf');
    // setError('');
  };

    const handleAddStock = async () => {
    try {
       await addStock({stockItems}).unwrap();
      setStockItems([]);

    } catch (err) {console.log("Error occurred! "+err);}
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={5}>
          <Card>
            <Card.Header as="h5">Product List</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <InputGroup>
                  <FormControl
                    placeholder="Search for a product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.itemId}>
                      <td>{product.itemName}</td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          onClick={() => handleAddStockItem(product)}
                        >
                          Add
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={7}>
          <Card>
            <Card.Header as="h5">Daily Stock Entry</Card.Header>
            <Card.Body ref={componentRef}>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style={{ width: '150px' }}>Produced Quantity</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.length > 0 ? (
                    stockItems.map((item) => (
                      <tr key={item.itemId}>
                        <td>{item.itemName}</td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.stockItemQuantity}
                            min={1}
                            max={item?.itemQuantity}
                            onChange={(e) =>
                              handleQuantityChange(item.itemId, e.target.value)
                            }
                          />
                        </td>
                        <td className="text-center">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveStockItem(item.itemId)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
                        No products added to the stock list yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <hr />
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any necessary notes here..."
                  isInvalid={!!isError}
                />
                <Form.Control.Feedback type="invalid">
                  {isError}
                </Form.Control.Feedback>
              </Form.Group>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end">
              {/* <Button variant="secondary" className="me-2" disabled={isLoading?isLoading:stockItems?.length>0?false:true} onClick={handlePrint}>
                <i className="bi bi-printer"></i> Print
              </Button>
              <Button variant="info" className="me-2" disabled={isLoading?isLoading:stockItems?.length>0?false:true} onClick={handleExportPDF}>
                <i className="bi bi-file-earmark-pdf"></i> Export as PDF
              </Button> */}
              {
                isLoading?              <Button variant="primary" disabled={isLoading}>
                Saving Stock...
              </Button>:              <Button variant="primary" onClick={handleAddStock} disabled={stockItems?.length>0?false:true}>
                Save Stock 
              </Button>
              }

            </Card.Footer>
          </Card>
          {isError && <Alert variant="danger" className="mt-3">{error.status + " " + error.data.message}</Alert>}
        </Col>
      </Row>
    </Container>
  );
};

export default StockEntry;
