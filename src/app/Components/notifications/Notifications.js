import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Badge, Stack } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Bell } from 'react-bootstrap-icons';
import { Cancel } from '@mui/icons-material';

// Mock data simulating an API response.
const mockApiResponse = [
    { "type": "header", "version": "5.2.0", "comment": "Export to JSON plugin for PHPMyAdmin" },
    { "type": "database", "name": "mystock" },
    {
        "type": "table", "name": "notifications", "database": "mystock", "data": [
            { "id": "1", "title": "Low Stock", "message": "Low Stock for \"Cake Boards\" available 5pc", "created_at": "2025-08-04 14:31:51", "is_read": "0", "notification_type": "stock_warning", "severity_level": "warning" },
            { "id": "2", "title": "New Order Received", "message": "Order #12345 has been placed successfully.", "created_at": "2025-08-04 10:15:00", "is_read": "0", "notification_type": "new_order", "severity_level": "info" },
            { "id": "3", "title": "Payment Failed", "message": "Payment for invoice #INV-007 failed.", "created_at": "2025-08-03 18:05:23", "is_read": "0", "notification_type": "payment_issue", "severity_level": "error" },
            { "id": "4", "title": "System Update", "message": "A system update is scheduled for tonight at 11 PM.", "created_at": "2025-08-03 09:00:00", "is_read": "1", "notification_type": "system_message", "severity_level": "info" },
            { "id": "5", "title": "Low Stock", "message": "Low Stock for \"Sprinkles\" available 10pc", "created_at": "2025-07-31 11:20:10", "is_read": "1", "notification_type": "stock_warning", "severity_level": "warning" }
        ]
    }
];

// --- Self-Contained Notification Component ---
export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [notificationIdToDelete, setNotificationIdToDelete] = useState(null);
    const [theme, setTheme] = useState('light');
    const [hoveredId, setHoveredId] = useState(null);

    // --- Effects for Initialization and Theme Syncing ---
    useEffect(() => {
        const tableData = mockApiResponse.find(item => item.type === 'table' && item.name === 'notifications');
        if (tableData) {
            setNotifications(tableData.data);
        }

        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(savedTheme);
        document.documentElement.dataset.bsTheme = savedTheme;

        const handleStorageChange = (event) => {
            if (event.key === 'theme') {
                const newTheme = event.newValue || 'light';
                setTheme(newTheme);
                document.documentElement.dataset.bsTheme = newTheme;
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // --- Utility Functions ---
    const severityMap = {
        info: { variant: 'primary', icon: 'fas fa-info-circle' },
        warning: { variant: 'warning', icon: 'fas fa-exclamation-triangle' },
        error: { variant: 'danger', icon: 'fas fa-times-circle' },
        success: { variant: 'success', icon: 'fas fa-check-circle' }
    };

    const formatDateGroup = (dateString) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const notificationDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        notificationDate.setHours(0, 0, 0, 0);

        if (today.getTime() === notificationDate.getTime()) return 'Today';
        if (yesterday.getTime() === notificationDate.getTime()) return 'Yesterday';
        return notificationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- Memoized Calculations ---
    const groupedNotifications = useMemo(() => {
        const groups = notifications.reduce((acc, notification) => {
            const date = notification.created_at.split(' ')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(notification);
            return acc;
        }, {});
        return Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => ({ title: formatDateGroup(date), notifications: groups[date] }));
    }, [notifications]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => n.is_read === '0').length;
    }, [notifications]);

    // --- Delete Handlers ---
    const handleDeleteClick = (id) => {
        setNotificationIdToDelete(id);
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        setNotifications(prev => prev.filter(n => n.id !== notificationIdToDelete));
        setShowConfirm(false);
        setNotificationIdToDelete(null);
    };

    const cancelDelete = () => {
        setShowConfirm(false);
        setNotificationIdToDelete(null);
    };

    return (
        <>
            <Button variant={theme === 'light' ? 'outline-secondary' : 'outline-light'} onClick={() => setShowModal(true)} className="position-relative rounded-circle text-center d-flex justify-content-center align-items-center bg-secondary" style={{ width: '30px', height: '30px' }}>
                <i className='text-light'><Bell/></i>
                {unreadCount > 0 &&
                    <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                        {unreadCount > 0 ? unreadCount : ''}
                    </Badge>
                }
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md" scrollable>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="h5">Notifications</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {groupedNotifications.length > 0 ? (
                        <Stack gap={2}>
                            {groupedNotifications.map((group) => (
                                <div key={group.title}>
                                    <h6 className="text-muted small mb-2 px-2">{group.title}</h6>
                                    <Stack gap={2}>
                                        {group.notifications.map(notification => {
                                            const severity = severityMap[notification.severity_level] || severityMap.info;
                                            const isUnread = notification.is_read === '0';
                                            return (
                                                <div
                                                    key={notification.id}
                                                    onMouseEnter={() => setHoveredId(notification.id)}
                                                    onMouseLeave={() => setHoveredId(null)}
                                                    className={`d-flex align-items-start p-3 rounded position-relative notification-item ${isUnread ? 'bg-body-secondary' : ''}`}
                                                >
                                                    <div className={`text-${severity.variant} bg-${severity.variant}-subtle rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                        <i className={severity.icon} style={{ fontSize: '1.2rem' }}></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <p className="fw-bold mb-1">{notification.title}</p>
                                                        <p className="mb-1 text-muted small">{notification.message}</p>
                                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <Button
                                                    variant={theme === 'light' ? 'light' : 'dark'}
                                                        // variant="light"
                                                        className="p-0 rounded-circle"
                                                        style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            position: 'absolute',
                                                            right: '15px',
                                                            top: '15px',
                                                            opacity: hoveredId === notification.id ? 1 : 0,
                                                            transition: 'opacity 0.2s ease-in-out'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(notification.id);
                                                        }}
                                                    >
                                                        <i className=""><Cancel/></i>
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </Stack>
                                </div>
                            ))}
                        </Stack>
                    ) : (
                        <div className="text-center text-muted p-5">
                            <i className="fas fa-bell-slash fs-2"></i>
                            <p className="mt-2">You have no new notifications.</p>
                        </div>
                    )}
                </Modal.Body>
                 <Modal.Footer className="justify-content-center border-0">
                    <Button variant="link" className="text-decoration-none text-muted">View all notifications</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showConfirm} onHide={cancelDelete} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this notification?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelDelete}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
