import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import './Notification.css';

const Notification = ({ isOpen, isSuccess, message, duration, onClose }) => {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);

      // Auto-close after the specified duration
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [isOpen, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`notification ${isSuccess ? 'success' : 'error'}`}>
      <div className="icon">
        {isSuccess ? (
          <span className="checkmark">✔</span>
        ) : (
          <span className="cross">✖</span>
        )}
      </div>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={() => setVisible(false)}>
        ✕
      </button>
    </div>
  );
};

Notification.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isSuccess: PropTypes.bool,
  message: PropTypes.string.isRequired,
  duration: PropTypes.number,
  onClose: PropTypes.func,
};

Notification.defaultProps = {
  isSuccess: true,
  duration: 3000,
  onClose: null,
};

export default Notification;
