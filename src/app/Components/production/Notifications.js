import React, { useState } from "react";
import { Dropdown, Badge, ListGroup, Button, Modal, Alert } from "react-bootstrap";
import { Bell } from "react-bootstrap-icons";

const Notification = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Low stock warning", type: "warning", read: false, timestamp: "2025-03-10T14:30:00Z" },
    { id: 2, text: "New order received", type: "info", read: false, timestamp: "2025-03-11T10:15:00Z" },
    { id: 3, text: "System error detected", type: "danger", read: true, timestamp: "2025-03-09T08:45:00Z" },
    { id: 4, text: "Order shipped", type: "success", read: true, timestamp: "2025-03-07T16:00:00Z" },
  ]);

  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const timeAgo = (timestamp) => {
    const diffMs = new Date() - new Date(timestamp);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Today" : `${diffDays} days ago`;
  };

  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle as="span" className="position-relative text-success" style={{ cursor: 'pointer' }}>
          <Bell size={24} className="bg-transparent text-white" />
          {unreadCount > 0 && (
            <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
              {unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu style={{ minWidth: "300px" }}>
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <ListGroup.Item className="text-center">No notifications</ListGroup.Item>
            ) : (
              notifications.map((n) => (
                <ListGroup.Item
                  key={n.id}
                  className="p-0 border-0 mt-2 mb-2 ms-2 me-2"
                  onClick={() => {
                    markAsRead(n.id);
                    setSelectedNotification(n);
                  }}
                >
                  <Alert variant={n.type} className="mb-0 px-3 py-2">
                    <strong>{n.text}</strong>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {new Date(n.timestamp).toLocaleString()} - {timeAgo(n.timestamp)}
                    </div>
                  </Alert>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Dropdown.Menu>
      </Dropdown>

      <Modal show={!!selectedNotification} onHide={() => setSelectedNotification(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Notification Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <>
              <p><strong>Message:</strong> {selectedNotification.text}</p>
              <p><strong>Type:</strong> {selectedNotification.type}</p>
              <p><strong>Date:</strong> {new Date(selectedNotification.timestamp).toLocaleString()}</p>
              <p><strong>Time Ago:</strong> {timeAgo(selectedNotification.timestamp)}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Notification;
