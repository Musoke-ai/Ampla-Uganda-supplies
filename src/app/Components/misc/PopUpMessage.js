import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const PopupMessage = ({ visible, type = "success", message = "", onClose }) => {
  const popupAnimation = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0%)" : "translateY(-50%)",
    config: { tension: 220, friction: 20 },
  });

  const popupStyle = {
    success: {
      color: "#28a745",
      borderColor: "#28a745",
      backgroundColor: "#d4edda",
    },
    error: {
      color: "#dc3545",
      borderColor: "#dc3545",
      backgroundColor: "#f8d7da",
    },
    default: {
      color: "#6c757d",
      borderColor: "#6c757d",
      backgroundColor: "#e2e3e5",
    },
  };

  const currentStyle = popupStyle[type] || popupStyle.default;

  return (
    <animated.div
      style={{
        ...popupAnimation,
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "16px",
        borderRadius: "8px",
        border: "2px solid",
        ...currentStyle,
        zIndex: 1000,
        display: visible ? "flex" : "none",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      {type === "success" ? (
        <FaCheckCircle size={24} />
      ) : type === "error" ? (
        <FaTimesCircle size={24} />
      ) : (
        <FaCheckCircle size={24} style={{ color: currentStyle.color }} />
      )}
      <div style={{ fontSize: "16px" }}>{message || "No message provided."}</div>
      <button
        style={{
          marginLeft: "auto",
          border: "none",
          background: "transparent",
          color: currentStyle.color,
          fontSize: "18px",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        ✖
      </button>
    </animated.div>
  );
};

export default PopupMessage;
