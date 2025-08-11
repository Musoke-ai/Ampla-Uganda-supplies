import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const PackagePage = () => {
  // Sample package data
  const packages = [
    {
      id: 1,
      name: 'Basic',
      price: '$10/month',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      buttonLabel: 'Choose Basic',
    },
    {
      id: 2,
      name: 'Standard',
      price: '$20/month',
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
      buttonLabel: 'Choose Standard',
    },
    {
      id: 3,
      name: 'Premium',
      price: '$50/month',
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
      buttonLabel: 'Choose Premium',
    },
  ];

  return (
    <Container className="my-5">
      {/* Header Section */}
      <div className="text-center mb-5">
        <h1 className="fw-bold">Our Packages</h1>
        <p className="text-muted">
          Choose a package that fits your business needs and unlock more features.
        </p>
      </div>

      {/* Package Cards */}
      <Row className="gy-4">
        {packages.map((pkg) => (
          <Col key={pkg.id} sm={12} md={6} lg={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fw-bold text-primary">{pkg.name}</Card.Title>
                <Card.Subtitle className="mb-3 text-muted">{pkg.price}</Card.Subtitle>
                <ul className="list-unstyled mb-4">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="mb-2">
                      ✅ {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" className="w-100">
                  {pkg.buttonLabel}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default PackagePage;
