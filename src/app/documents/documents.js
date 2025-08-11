import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Modal, TextField, InputAdornment, IconButton, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

const documentsData = [
  {
    id: 1, title: 'Invoice #001', number: 'INV001', date: '2024-08-10', customerName: 'John Doe',
    customerAddress: '123 Main St, Springfield', items: [
      { description: 'Product A', quantity: 2, price: 50 },
      { description: 'Product B', quantity: 1, price: 100 }
    ], subtotal: 200, tax: 20, total: 220, notes: 'Thank you for your business!'
  },
  // More documents here
];

const DocumentsPage = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '', number: '', date: '', customerName: '', customerAddress: '', items: [{ description: '', quantity: '', price: '' }], subtotal: '', tax: '', total: '', notes: ''
  });

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setShowEditor(true);
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleNewDocumentChange = (e) => {
    const { name, value } = e.target;
    setNewDocument({ ...newDocument, [name]: value });
  };

  const handleCreateDocument = () => {
    // Logic to create a new document
    setOpenModal(false);
  };

  return (
    <Box sx={{ padding: '40px', backgroundColor: '#f4f4f9' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Documents
      </Typography>

      {/* Document Table */}
      <Paper
        sx={{
          padding: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="documents table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentsData.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.title}</TableCell>
                  <TableCell>{document.number}</TableCell>
                  <TableCell>{document.date}</TableCell>
                  <TableCell>{document.customerName}</TableCell>
                  <TableCell>${document.subtotal}</TableCell>
                  <TableCell>${document.tax}</TableCell>
                  <TableCell>${document.total}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDocumentClick(document)} color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="primary">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ marginTop: '20px', width: '100%', padding: '10px' }}
          onClick={handleOpenModal}
        >
          Create New Document
        </Button>
      </Paper>

      {/* Document Editor */}
      <Modal open={showEditor} onClose={() => setShowEditor(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '10px',
          }}
        >
          {selectedDocument && (
            <>
              <Typography variant="h6" component="h2" sx={{ marginBottom: '20px' }}>
                {selectedDocument.title}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Number:</strong> {selectedDocument.number}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Date:</strong> {selectedDocument.date}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Customer:</strong> {selectedDocument.customerName}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Address:</strong> {selectedDocument.customerAddress}
              </Typography>
              <Divider sx={{ marginY: '20px' }} />
              <Typography variant="h6" sx={{ marginBottom: '10px' }}>
                Items
              </Typography>
              {selectedDocument.items.map((item, index) => (
                <Box key={index} sx={{ marginBottom: '10px' }}>
                  <Typography variant="body1">
                    <strong>Description:</strong> {item.description}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Quantity:</strong> {item.quantity}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Price:</strong> ${item.price}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ marginY: '20px' }} />
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Subtotal:</strong> ${selectedDocument.subtotal}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '10px' }}>
                <strong>Tax:</strong> ${selectedDocument.tax}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '20px' }}>
                <strong>Total:</strong> ${selectedDocument.total}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '20px' }}>
                <strong>Notes:</strong> {selectedDocument.notes}
              </Typography>
              <Button variant="contained" color="primary" startIcon={<EditIcon />}>
                Edit Document
              </Button>
            </>
          )}
        </Box>
      </Modal>

      {/* Create New Document Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '10px',
          }}
        >
          <Typography variant="h6" component="h2" sx={{ marginBottom: '20px' }}>
            Create New Document
          </Typography>
          <TextField
            label="Title"
            name="title"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.title}
            onChange={handleNewDocumentChange}
          />
          <TextField
            label="Number"
            name="number"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.number}
            onChange={handleNewDocumentChange}
          />
          <TextField
            label="Date"
            name="date"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.date}
            onChange={handleNewDocumentChange}
          />
          <TextField
            label="Customer Name"
            name="customerName"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.customerName}
            onChange={handleNewDocumentChange}
          />
          <TextField
            label="Customer Address"
            name="customerAddress"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.customerAddress}
            onChange={handleNewDocumentChange}
          />
          <TextField
            label="Subtotal"
            name="subtotal"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.subtotal}
            onChange={handleNewDocumentChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <TextField
            label="Tax"
            name="tax"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.tax}
            onChange={handleNewDocumentChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <TextField
            label="Total"
            name="total"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.total}
            onChange={handleNewDocumentChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <TextField
            label="Notes"
            name="notes"
            variant="outlined"
            fullWidth
            sx={{ marginBottom: '20px' }}
            value={newDocument.notes}
            onChange={handleNewDocumentChange}
          />
          <Button variant="contained" color="primary" onClick={handleCreateDocument}>
            Create Document
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default DocumentsPage;
