import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";
import Toast from "../misc/Toast";// Assuming a Toast component exists for user feedback.

const QuickSales = () => {
  const [productList, setProductList] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    // Fetch initial data for products and customers
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products"); // Replace with actual API endpoint
      const data = await response.json();
      setProductList(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers"); // Replace with actual API endpoint
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    }
  };

  const calculateTotals = () => {
    const total = saleItems.reduce(
      (acc, item) => acc + item.salePrice * item.saleQuantity,
      0
    );
    const productCount = saleItems.reduce((acc, item) => acc + item.saleQuantity, 0);
    setTotalCost(total);
    setTotalProducts(productCount);
  };

  const addSaleItem = (product) => {
    setSaleItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, saleQuantity: item.saleQuantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, saleQuantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setSaleItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, saleQuantity: quantity } : item
      )
    );
  };

  const removeSaleItem = (productId) => {
    setSaleItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const fuse = new Fuse(productList, {
      keys: ["name", "category"],
      threshold: 0.3,
    });
    const results = term ? fuse.search(term).map((result) => result.item) : productList;
    setProductList(results);
  };

  const handleSales = async () => {
    if (!selectedCustomer || saleItems.length === 0) {
      Toast("Please select a customer and add items to the sale", "error");
      return;
    }

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: selectedCustomer,
          items: saleItems,
          totalCost,
        }),
      });

      if (response.ok) {
        Toast("Sale completed successfully!", "success");
        setSaleItems([]);
        setSelectedCustomer(null);
        setTotalCost(0);
        setTotalProducts(0);
      } else {
        throw new Error("Sale submission failed");
      }
    } catch (error) {
      Toast("Error completing sale", "error");
      console.error(error);
    }
  };

  useEffect(() => {
    calculateTotals();
  }, [saleItems]);

  return (
    <div className="quick-sales">
      <div className="header">
        <h1>Quick Sales</h1>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="product-list">
        {productList.map((product) => (
          <div key={product.id} className="product-item">
            <p>{product.name}</p>
            <button onClick={() => addSaleItem(product)}>Add</button>
          </div>
        ))}
      </div>

      <div className="customer-selector">
        <select
          value={selectedCustomer?.id || ""}
          onChange={(e) =>
            setSelectedCustomer(customers.find((c) => c.id === parseInt(e.target.value)))
          }
        >
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sale-items">
        <h2>Sale Items</h2>
        {saleItems.map((item) => (
          <div key={item.id} className="sale-item">
            <p>{item.name}</p>
            <input
              type="number"
              value={item.saleQuantity}
              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
            />
            <button onClick={() => removeSaleItem(item.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="totals">
        <p>Total Products: {totalProducts}</p>
        <p>Total Cost: {totalCost.toFixed(2)}</p>
      </div>

      <button onClick={handleSales}>Complete Sale</button>
    </div>
  );
};

export default QuickSales;
