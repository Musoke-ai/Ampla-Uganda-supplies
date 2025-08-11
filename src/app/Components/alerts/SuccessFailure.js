import React, { useState } from "react";
import { Alert, Button } from "react-bootstrap";

const ActionAlert = () => {
  const [alert, setAlert] = useState({
    show: false,
    type: "", // 'success' or 'error'
    message: "",
  });

  const [timeoutId, setTimeoutId] = useState(null);

  // Show alert and auto-hide it after a specified time
  const showAlert = (type, message, autoHideTime = 5000) => {
    // Clear any existing timeout
    if (timeoutId) clearTimeout(timeoutId);

    setAlert({ show: true, type, message });

    // Set a timeout to auto-hide the alert
    const id = setTimeout(() => {
      setAlert({ ...alert, show: false });
    }, autoHideTime);

    setTimeoutId(id);
  };

  const handleSuccess = () => {
    showAlert("success", "Action performed successfully!", 5000);
  };

  const handleFailure = () => {
    showAlert("error", "Action failed. Please try again.", 5000);
  };

  const handleClose = () => {
    // Clear timeout and hide the alert
    if (timeoutId) clearTimeout(timeoutId);
    setAlert({ ...alert, show: false });
  };

  return (
    <div className="container mt-4">
      <Button variant="success" onClick={handleSuccess} className="me-2">
        Perform Success Action
      </Button>
      <Button variant="danger" onClick={handleFailure}>
        Perform Error Action
      </Button>

      {alert.show && (
        <Alert
          variant={alert.type === "success" ? "success" : "danger"}
          onClose={handleClose}
          dismissible
          className="mt-3"
        >
          <div className="d-flex align-items-center">
            <span className="me-2">
              {alert.type === "success" ? "✔️" : "❌"}
            </span>
            <span>{alert.message}</span>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default ActionAlert;
