import {useRef, useState, useEffect } from 'react';
import { Button, Modal, Form, Container, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaIndustry, FaTools, FaCogs } from "react-icons/fa";
// import "animate.css";

import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../auth/authSlice';
import { useLoginMutation } from '../../../auth/authApiSlice';
import { Business } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';
import usePersist from '../../../hooks/usePersist';

const LoginPage = () => {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setShow(false);
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleShow = (selectedRole) => {
    setRole(selectedRole);
    setShow(true);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setError("All fields are required!");
      return;
    }
    setError("");
    alert("Login successful!");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 position-relative bg-dark text-light overflow-hidden">
      {/* Green Bubbles */}
      <div
        className="position-absolute bg-success rounded-circle"
        style={{ width: "100px", height: "100px", top: "10px", left: "10px", opacity: 0.3 }}
      ></div>
      <div
        className="position-absolute bg-success rounded-circle"
        style={{ width: "100px", height: "100px", bottom: "10px", right: "10px", opacity: 0.3 }}
      ></div>
      
      {/* Factory Icons with Animation */}
      <FaIndustry className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ top: "20%", left: "5%", fontSize: "50px", opacity: 0.5 }} />
      <FaTools className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ top: "50%", right: "10%", fontSize: "50px", opacity: 0.5 }} />
      <FaCogs className="position-absolute text-success animate__animated animate__fadeIn animate__slower" style={{ bottom: "20%", left: "40%", fontSize: "50px", opacity: 0.5 }} />
      
      <Container className="text-center p-5 bg-black shadow rounded">
        <h2 className="mb-4 text-success">Login to Ampla Uganda</h2>
        <Button variant="success" className="m-2" onClick={() => handleShow("admin")}>
          Admin Login
        </Button>
        {/* <Button variant="light" className="m-2 text-success" onClick={() => handleShow("user")}>
          User Login
        </Button> */}
      </Container>

      {/* Login Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton className="bg-dark text-light">
          <Modal.Title>{role === "admin" ? "Admin Login" : "User Login"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-black text-light">
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Enter email" 
                className="bg-dark text-light border-success" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Password" 
                className="bg-dark text-light border-success" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
          </Form>
          <p>Forget your password <a href="http://localhost/mystock/index.php/login/magic-link">Use a Login Link</a></p>
        </Modal.Body>
        <Modal.Footer className="bg-dark text-light">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="success" onClick={handleLogin}>Login</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LoginPage;
