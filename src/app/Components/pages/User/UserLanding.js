// UserPage.js
import React from "react";
import { Container, Card, Row, Col } from "react-bootstrap";
// import { useAuth } from "./authContext";
import AccessDenied from "./AccessDenied";
// Import icons from react-icons
import { 
    FaUserShield, FaIndustry, FaBoxes, FaUserTag, FaMoneyBillWave, 
    FaUserCog, FaCheckCircle, FaHeadset, FaUsers 
  } from "react-icons/fa";
  import { Route, Routes, Outlet } from "react-router-dom";
  import { Link } from "react-router-dom";

const allowedRoles = ["Admin", "Production Manager", "Inventory Manager"];

const roles = [
    {
      name: "Production Manager",
      icon: <FaIndustry size={40} color="#0d6efd" />,
      path:"/userpagelayout"
    },
    {
      name: "Inventory Manager",
      icon: <FaBoxes size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Sales Representative",
      icon: <FaUserTag size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Accountant / Finance Officer",
      icon: <FaMoneyBillWave size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Worker / Production Staff",
      icon: <FaUserCog size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Quality Control Officer",
     icon: <FaCheckCircle size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Customer Support",
      icon: <FaHeadset size={40} color="#0d6efd" />,
      path:"productionManager"
    },
    {
      name: "Supervisor / Team Leader",
      icon: <FaUsers size={40} color="#0d6efd" />,
      path:"productionManager"
    }
  ];
  

const UserLanding = () => {
//   const { currentUser } = useAuth();

//   if (!allowedRoles.includes(currentUser.role)) {
//     return <AccessDenied />;
//   }

  return (
    <Container className="my-4">
    <h3 className="text-center mb-4">User Roles</h3>
    <Row xs={2} sm={3} md={4} lg={5} className="g-3">
      {roles.map((role) => (
        <Col key={role.name}>
            <Link to={role.path}>
          <Card className="text-center h-100 shadow-sm p-2">
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              {role.icon}
              <Card.Title className="mt-2 fs-6">{role.name}</Card.Title>
            </div>
          </Card>
          </Link>
        </Col>
      ))}
    </Row>
  </Container>
  );
};

export default UserLanding;
