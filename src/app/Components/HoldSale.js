import React, { useState, useEffect } from 'react';
import { Button, Table, Form } from 'react-bootstrap';

const HoldSaleManager = ({ cart, setCart }) => {
  const [heldSales, setHeldSales] = useState([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const storedSales = JSON.parse(localStorage.getItem('heldSales')) || [];
    setHeldSales(storedSales);
  }, []);

  const holdCurrentSale = () => {
    if (cart.length === 0) {
      alert('No items in cart to hold.');
      return;
    }

    const newHold = {
      id: Date.now(),
      customer: customerName || 'Anonymous',
      cart,
      date: new Date().toLocaleString(),
    };

    const updatedHolds = [newHold, ...heldSales];
    setHeldSales(updatedHolds);
    localStorage.setItem('heldSales', JSON.stringify(updatedHolds));
    setCart([]);
    setCustomerName('');
  };

  const restoreSale = (id) => {
    const selectedHold = heldSales.find(sale => sale.id === id);
    if (selectedHold) {
      setCart(selectedHold.cart);
      const remainingHolds = heldSales.filter(sale => sale.id !== id);
      setHeldSales(remainingHolds);
      localStorage.setItem('heldSales', JSON.stringify(remainingHolds));
    }
  };

  const removeSale = (id) => {
    const filtered = heldSales.filter(sale => sale.id !== id);
    setHeldSales(filtered);
    localStorage.setItem('heldSales', JSON.stringify(filtered));
  };

  return (
    <div className="p-3">
      <h4>Hold Sale</h4>
      <Form.Control
        type="text"
        placeholder="Enter Customer Name (optional)"
        value={customerName}
        onChange={e => setCustomerName(e.target.value)}
        className="mb-2"
      />
      <Button variant="warning" onClick={holdCurrentSale}>
        Hold Current Sale
      </Button>

      <hr />

      <h5>Held Sales</h5>
      {heldSales.length === 0 ? (
        <p>No held sales.</p>
      ) : (
        <Table bordered striped>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {heldSales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.customer}</td>
                <td>{sale.date}</td>
                <td>{sale.cart.length} item(s)</td>
                <td>
                  <Button variant="success" size="sm" onClick={() => restoreSale(sale.id)}>Restore</Button>{' '}
                  <Button variant="danger" size="sm" onClick={() => removeSale(sale.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default HoldSaleManager;
