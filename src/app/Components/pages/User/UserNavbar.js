import React from 'react';
import { Navbar, Nav, Offcanvas, Container } from 'react-bootstrap';
import { FaHome, FaList, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import './userpage.css';

const UserNavbar = () => {

  return (
    <div className="responsive-navbar">
    {/* Side Navbar for large screens */}
    <div className="side-navbar d-none d-lg-block bg-dark text-white">
      <Nav className="flex-column p-3">
        <h4 className="text-white mb-4">Ampla Uganda</h4>
        <Nav.Link href="#home" className="text-white"><FaHome /> Home</Nav.Link>
        <Nav.Link href="#features" className="text-white"><FaList /> Features</Nav.Link>
        <Nav.Link href="#pricing" className="text-white"><FaDollarSign /> Pricing</Nav.Link>
        <Nav.Link href="#about" className="text-white"><FaInfoCircle /> About</Nav.Link>
      </Nav>
    </div>

    {/* Top Navbar for small/medium screens */}
    <div className="mobile-navbar d-lg-none">
      <Navbar bg="dark" variant="dark" expand={false}>
        <Container fluid>
          <Navbar.Brand href="#">MyApp</Navbar.Brand>
          <Navbar.Toggle aria-controls="offcanvasNavbar" />
          <Navbar.Offcanvas
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
            placement="start"
            className="bg-dark text-white"
          >
            <Offcanvas.Header closeButton closeVariant="white">
              <Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-column">
                <Nav.Link href="#home" className="text-white"><FaHome /> Home</Nav.Link>
                <Nav.Link href="#features" className="text-white"><FaList /> Features</Nav.Link>
                <Nav.Link href="#pricing" className="text-white"><FaDollarSign /> Pricing</Nav.Link>
                <Nav.Link href="#about" className="text-white"><FaInfoCircle /> About</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </div>
  </div>
  );
}

export default UserNavbar;
