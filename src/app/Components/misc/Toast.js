import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
// import "./Toast.css"; // Assuming you style the toast via a CSS file

const Toast = ({ message, type, onClose, position = "top-right" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className={`toast toast-${type} toast-${position}`}>
      <span>{message}</span>
      <button onClick={() => { setVisible(false); onClose(); }}>✖</button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]).isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"]),
};

export default Toast;
