import React from 'react';
import { Button } from 'react-bootstrap';

const AccessDenied = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <div className="text-center">
        <h2 className="mb-4 text-danger">Access Denied</h2>
        <p className="mb-4">You do not have permission to access this page.</p>
        <Button variant="primary" onClick={handleGoBack}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default AccessDenied;
