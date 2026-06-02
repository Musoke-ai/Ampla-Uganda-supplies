import React, { useState, useEffect, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import {
  InputGroup,
  Container,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Card,
  Alert,
  Accordion,
} from "react-bootstrap";
import { toast } from 'react-toastify';
import { useRegisterMutation } from "../../auth/authApiSlice";
import { useSelector } from "react-redux";
import {
  selectAccounts,
  useEditAccountMutation,
  useDeleteUserMutation,
} from "../../features/api/AccountsSlice";
import { Eye, EyeSlash, Lock, PencilSquare, TrashFill } from "react-bootstrap-icons";
import jsPDF from 'jspdf';
import {
  paginateItems,
  ProductionTableFooter,
} from "./ProductionTableControls";
// --- Data and Configuration ---
const rolesConfig = [
  {
    name: "Production",
    subRoles: ["Employees", "Raw Materials", "Expenses", "Orders", "Batches"],
  },
  "Dashboard",
  "Sales Desk",
  "Products",
  "Categories",
  "Stock",
  "Customers",
  "Sales",
  "Credit Sales",
  "Reports",
  "History",
  "Settings",
];
const permissionsConfig = [
  { name: "View", icon: "bi-eye" },
  { name: "Create", icon: "bi-plus-circle" },
  { name: "Update", icon: "bi-pencil-square" },
  { name: "Delete", icon: "bi-trash" },
];

/**
 * Transforms user data into a structured format with grouped permissions,
 * supporting both generic and granular permission types.
 *
 * @param {Array<Object>} usersData The raw user data from the backend.
 * @returns {Array<Object>} The transformed user data.
 */
function transformUsers(usersData) {
  // Helper to capitalize the first letter of a string
  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  // Helper to format role keys (e.g., "rawmaterials") into display names (e.g., "Raw Materials")
  const formatRoleName = (roleKey) => {
    const specialNames = {
      rawmaterials: "Raw Materials",
      creditsales: "Credit Sales",
      salesdesk: "Sales Desk",
      productionmanager: "Production Manager",
      inventorymanager: "Inventory Manager",
      categories: "Categories",
      batches: "Batches",
    };
    return specialNames[roleKey] || capitalize(roleKey);
  };

  return usersData.map((user) => {
    const newPermissions = {};

    // Determine if the user has granular permissions (e.g., "employeesview")
    // or generic permissions (e.g., "edit", "create").
    const isGranular = user.roles.some((role) =>
      user.permissions.some((perm) => perm.startsWith(role) && perm !== role)
    );

    if (isGranular) {
      // --- Logic for new Granular Permissions ---
      user.permissions.forEach((perm) => {
        const roleKey = user.roles.find((r) => perm.startsWith(r));
        if (roleKey) {
          const moduleName = formatRoleName(roleKey);
          const action = capitalize(perm.substring(roleKey.length));

          if (!newPermissions[moduleName]) {
            newPermissions[moduleName] = [];
          }
          if (!newPermissions[moduleName].includes(action)) {
            newPermissions[moduleName].push(action);
          }
        }
      });
    } else {
      // --- Logic for old Generic Permissions ---
      const actions = user.permissions.map(capitalize);
      user.roles.forEach((roleKey) => {
        const roleName = formatRoleName(roleKey);
        newPermissions[roleName] = actions;
      });
    }
    
    const cleanUsername = user.username ? user.username.replace(/\.com\.com$/, ".com") : "N/A";

    return {
      id: user.id,
      username: cleanUsername,
      email: user.email,
      permissions: newPermissions,
    };
  });
}

// --- Main App Component ---
export default function AdminAccountManager() {
  const accounts = useSelector(selectAccounts);
  const [createUser, { isLoading }] = useRegisterMutation();
  const [updateUser, { isLoading: isUpdateLoading }] = useEditAccountMutation();
  const [deleteUser, { isLoading: isDeleteLoading }] = useDeleteUserMutation();
//   const initialUsers = transformUsers(accounts);
const users = useMemo(() => transformUsers(accounts), [accounts]);
const [isEdit, setIsEdit] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

//   const [users, setUsers] = useState(initialUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToView, setUserToView] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // State for the form modal
  const [formData, setFormData] = useState({});
const [validated, setValidated] = useState(false);
const [activeRoles, setActiveRoles] = useState([]);
const [showPassword, setShowPassword] = useState(false);

useEffect(() => {
  const nextTotalPages = Math.max(1, Math.ceil(users.length / rowsPerPage));
  if (currentPage > nextTotalPages) {
    setCurrentPage(nextTotalPages);
  }
}, [currentPage, rowsPerPage, users.length]);

const {
  totalPages,
  paginatedItems: paginatedUsers,
} = useMemo(
  () => paginateItems(users, currentPage, rowsPerPage),
  [currentPage, rowsPerPage, users]
);

// --- Helper function to generate and download the PDF ---
/**
 * Generates a PDF with the user's account details and initiates a download.
 * @param {object} userData - The user's data from the form.
 * @param {string} userData.username - The user's chosen username.
 * @param {string} userData.email - The user's email address.
 * @param {string} userData.password - The user's password.
 */
const downloadAccountDetailsPdf = (userData) => {
  // 1. Create a new jsPDF instance
  const doc = new jsPDF();

  // Get the current date and time for the timestamp
  const creationTimestamp = new Date().toLocaleString();

  // 2. Add content to the PDF
  // Add a title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Account Details', 20, 30);

  // Add a horizontal line separator
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Add user details
  doc.setFontSize(16);
  doc.setFont('times', 'normal');
  doc.text(`Welcome, ${userData.username}!`, 20, 50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Username:   ${userData.username}`, 20, 65);
  doc.text(`Email:      ${userData.email}`, 20, 75);
  // --- ADDED PASSWORD ---
  // Note: Including passwords in downloadable files is a significant security risk.
  doc.text(`Password:   ${userData.password}`, 20, 85);
  
  // --- ADDED TIMESTAMP ---
  doc.text(`Created On: ${creationTimestamp}`, 20, 95);


  // Add a strong security warning about the password
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 0, 0); // Set text color to red for emphasis
  doc.text(
    'WARNING: This document contains your plain-text password.',
    20,
    115
  );
  
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150); // Reset to a less prominent color
  doc.text(
    'Please store your credentials in a secure password manager and',
    20,
    122
  );
   doc.text(
    'save the file securely or delete it after memorizing it.',
    20,
    127
  );


  // 3. Save the PDF
  // This will trigger a download in the browser.
  doc.save(`${userData.username}-account-details.pdf`);
};

  // --- Toast and Modal Handlers ---
  const handleShowToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleOpenUserModal = (user = null) => {
    setCurrentUser(user);
    if (user) {
      const userPermissions = JSON.parse(JSON.stringify(user.permissions));
      setFormData({
        username: user.username,
        email: user.email,
        permissions: userPermissions,
      });
      setActiveRoles(Object.keys(userPermissions));
    } else {
      setFormData({ username: "", email: "", password: "", permissions: {} });
      setActiveRoles([]);
    }
    setShowPassword(false);
    setValidated(false);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setIsEdit(false);
    setShowUserModal(false);
    setCurrentUser(null);
    setFormData({});
    setActiveRoles([]);
    setShowPassword(false);
  };

  const handleOpenConfirmModal = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
  };

  const handleOpenViewModal = (user) => {
    setUserToView(user);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setIsEdit(false);
    setShowViewModal(false);
    setUserToView(null);
  };

  // --- CRUD Operations ---
  const handleDeleteUser = async () => {
    // setUsers(users.filter((u) => u.id !== userToDelete.id));
    // handleShowToast(`User "${userToDelete.username}" has been deleted.`);
   

 try {
        const data = await deleteUser({user_id: userToDelete.id}).unwrap();
        toast.success(data.message);
         handleCloseConfirmModal();
      } catch (err) {
        // return <Alerts heading="An error occured during registration!" message={error}/>
        if (!err.status) {
          // setErrMsg('No Server Response')
        //   window.alert("No Server Response");
        toast.error("No Server Response");

          // setShowError(true)
        } else if (err.status === 400) {
        //   window.alert("Check your credentials and try again.");
          toast.error("Check your credentials and try again.");
          // setErrMsg('Missing Businessname or Password');
          // setShowError(true)
        } else if (err.status === 401) {
        //   window.alert("Unauthorised");
          toast.error("Unauthorised");
          // setErrMsg('Unauthorised');
          // setShowError(true)
        } else if (err.status === 404) {
        //   window.alert("Not Found");
          toast.error("Not Found");
          // setErrMsg('Unauthorised');
          // setShowError(true)
        } else if (err.status === 500) {
        //   window.alert("Internal Server Error");
          toast.error("Internal Server Error");
          // setErrMsg('Unauthorised');
          // setShowError(true)
        } else if (err.status === 503) {
        //   window.alert("Service unavailable");
          toast.error("Service unavailable");
          // setErrMsg('Unauthorised');
          // setShowError(true)
        } else {
        //   window.alert("Check your credentials and try again.");
          toast.error("Check your credentials and try again.");
          // setErrMsg('Check your credentials and try again.');
          // setShowError(true)
          // errRef.current.focus();
        }
      }

  };

  /**
 * Processes a permissions object to extract roles and create a flat list of modified action strings.
 * This is the JavaScript equivalent of the PHP function.
 *
 * @param {object} permissions - The permissions object from the user payload.
 * Example: { 'Sales Desk': ['View', 'Create'] }
 * @returns {object} An object containing a 'roles' array and a flat 'actions' array.
 * Example: {
 * roles: ['Sales Desk'],
 * actions: ['Sales View', 'Sales Create']
 * }
 */
function extractAndModifyPermissions(permissions) {
    const extractedRoles = [];
    const allModifiedActions = [];

    // Check if the input is a valid object
    if (!permissions || typeof permissions !== 'object') {
        console.error("Invalid input: permissions must be an object.");
        return { roles: [], actions: [] };
    }

    // Iterate over each role (key) and its associated actions (value).
    // Object.entries() returns an array of a given object's own enumerable string-keyed property [key, value] pairs.
    for (const [role, actions] of Object.entries(permissions)) {
        // Add the full role name to our list of roles.
        extractedRoles.push(role);

        // Get the first word of the role to prepend to the action.
        // e.g., "Sales Desk" becomes "Sales".
        const rolePrefix = role.split(' ')[0];

        // Ensure actions is an array before iterating
        if (Array.isArray(actions)) {
            // Iterate over each action for the current role.
            for (const action of actions) {
                // Create the new permission string, e.g., "Sales View".
                const modifiedAction = `${rolePrefix} ${action}`;

                // Add the newly created permission string to our flat list.
                allModifiedActions.push(modifiedAction);
            }
        }
    }

    return {
        roles: extractedRoles,
        actions: allModifiedActions,
    };
}

  // --- Form Input Handlers ---
  const handleFormInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleToggle = (role, isChecked) => {
    const newActiveRoles = isChecked
      ? [...activeRoles, role]
      : activeRoles.filter((r) => r !== role);
    setActiveRoles(newActiveRoles);

    const newPermissions = { ...formData.permissions };
    if (isChecked) {
      // Add role with 'View' as a default permission
      newPermissions[role] = ["View"];
    } else {
      // Remove role and its permissions
      delete newPermissions[role];
    }
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handlePermissionChange = (role, permission, isChecked) => {
    const newPermissions = { ...formData.permissions };

    if (isChecked) {
      newPermissions[role].push(permission);
    } else {
      newPermissions[role] = newPermissions[role].filter(
        (p) => p !== permission
      );
    }

    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleUserFormSubmit = async (event) => {
      const form = event.currentTarget;
      event.preventDefault();
      event.stopPropagation();

      if (
        form.checkValidity() === false ||
        Object.keys(formData.permissions).length === 0
      ) {
        if (Object.keys(formData.permissions).length === 0) {
          handleShowToast("A user must have at least one role selected.");
        }
        setValidated(true);
        return;
      }

      const permissions = formData.permissions;
      const roleData = extractAndModifyPermissions(permissions);
      const _permissions = roleData.actions;
      const _roles = roleData.roles;

      if (currentUser) {
        // --- Update existing user ---
        try {
          const payload = {
            id: currentUser.id,
            username: formData.username,
            email: formData.email,
            roles: _roles,
            permissions: _permissions,
          };
          const data = await updateUser(payload).unwrap();
          toast.success(data.message || "User updated successfully!");
          handleCloseUserModal();
        } catch (err) {
          toast.error(err?.data?.message || "User update failed.");
        }
      } else {
        // --- Create new user ---
        try {
          const data = await createUser({
            ...formData,
            roles: _roles,
            permissions: _permissions,
            accountType: "sharedAccount",
          }).unwrap();
          // Call the PDF download function with the user's data
          downloadAccountDetailsPdf(formData);
          handleCloseUserModal();
          toast.success(data.message + " account details file will auto download!");
        } catch (err) {
          toast.error(err?.data?.message || "User creation failed.");
        }
      }
    };

  // --- Helper Components for Rendering ---
  const UserPermissionsDisplay = ({ permissions }) => {
    const getPermissionClass = (perm) => {
      switch (perm) {
        case "Delete":
          return "danger";
        case "Update":
          return "warning";
        case "Create":
          return "success";
        case "View":
          return "primary";
        default:
          return "secondary";
      }
    };
    return (
      <div>
        {rolesConfig.map((roleOrGroup, index) => {
          if (typeof roleOrGroup === "string") {
            const role = roleOrGroup;
            if (permissions[role]) {
              return (
                <div key={index} className="mb-3">
                  <strong>{role}</strong>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {permissions[role].map((p) => (
                      <Badge key={p} pill bg={getPermissionClass(p)}>
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            }
          } else {
            const groupName = roleOrGroup.name;
            const subRolePerms = roleOrGroup.subRoles.filter(
              (sr) => permissions[sr]
            );
            if (subRolePerms.length > 0) {
              return (
                <div key={index} className="mb-3">
                  <strong>{groupName}</strong>
                  <div className="mt-1 ps-3 ms-1 border-start">
                    {subRolePerms.map((subRole) => (
                      <div key={subRole} className="mb-2">
                        <div className="text-muted small">{subRole}</div>
                        <div className="d-flex flex-wrap gap-1">
                          {permissions[subRole].map((p) => (
                            <Badge key={p} pill bg={getPermissionClass(p)}>
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    );
  };

  return (
    // <Container className="py-4" style={{ backgroundColor: "#f8f9fa" }}>
    <Container className="py-4 production-section-shell">
      <div className="production-section-header">
        <div className="production-section-copy">
          <h1 className="d-flex align-items-center gap-3">
            <i className="bi bi-shield-check"></i> User Management
          </h1>
          <p>Create and manage user accounts with role-based permissions.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenUserModal()}>
          <i className="bi bi-person-plus-fill me-2"></i>Create New User
        </Button>
      </div>

      <div className="production-filter-bar">
        <div className="production-stat-row">
          <span className="production-stat-chip">Users: {users.length}</span>
          <span className="production-stat-chip">
            Roles assigned: {users.reduce((total, user) => total + Object.keys(user.permissions).length, 0)}
          </span>
        </div>
      </div>

      <Card className="production-table-card border-0 shadow-none">
        <Card.Body className="p-0">
          <div className="production-table-scroll">
            <Table responsive hover className="production-modern-table align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Assigned Roles</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ms-3">
                        <div className="fw-bold">{user.username}</div>
                        <div className="text-muted small">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge bg="light" text="dark">
                      {Object.keys(user.permissions).length} Roles
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => handleOpenViewModal(user)}
                    >
                      {/* <i className="bi bi-eye-fill"></i> */}
                     <Lock />
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => {handleOpenUserModal(user);setIsEdit(true)}}
                    >
                      <PencilSquare />
                    </Button> 
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleOpenConfirmModal(user)}
                    >
                      {/* <i className="bi bi-trash-fill"></i> */}
                      <TrashFill />
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">No users found.</td>
                </tr>
              ) : null}
            </tbody>
          </Table>
          </div>
          <ProductionTableFooter
            totalItems={users.length}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            itemLabel="users"
          />
        </Card.Body>
      </Card>

      {/* User Form Modal */}
      <Modal
        show={showUserModal}
        onHide={handleCloseUserModal}
        size="lg"
        backdrop="static"
        scrollable
        dialogClassName="production-modal-shell"
      >
        <Form noValidate validated={validated} onSubmit={handleUserFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <i
                className={
                  currentUser ? "bi bi-person-gear" : "bi bi-person-plus"
                }
              ></i>
              {currentUser ? "Edit User" : "Create New User"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="production-modal-stack">
              <div className="production-modal-hero">
                <div>
                  <h3>{currentUser ? "Update account access" : "Create a new workspace user"}</h3>
                  <p>
                    Set the account identity first, then choose the exact sections this user can view or manage.
                  </p>
                </div>
                <div className="production-stat-row">
                  <span className="production-stat-chip">Active roles: {activeRoles.length}</span>
                  <span className="production-stat-chip">
                    Permissions: {Object.values(formData.permissions || {}).reduce((total, perms) => total + perms.length, 0)}
                  </span>
                </div>
              </div>

              <div className="production-modal-section-card">
                <div className="production-modal-section-head">
                  <div>
                    <h4>Account Details</h4>
                    <p>These details identify the shared account inside the production workspace.</p>
                  </div>
                </div>
                <div className="production-account-grid">
                  <Form.Group controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      autoComplete="new-username"
                      readOnly
                      onFocus={(event) => event.target.removeAttribute("readonly")}
                      value={formData.username || ""}
                      onChange={handleFormInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a username.
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      autoComplete="new-email"
                      readOnly
                      onFocus={(event) => event.target.removeAttribute("readonly")}
                      value={formData.email || ""}
                      onChange={handleFormInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid email.
                    </Form.Control.Feedback>
                  </Form.Group>

                  {!currentUser ? (
                    <Form.Group controlId="password" className="production-form-grid-single">
                      <Form.Label>Password</Form.Label>
                      <InputGroup className="production-password-group">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          readOnly
                          onFocus={(event) => event.target.removeAttribute("readonly")}
                          onChange={handleFormInputChange}
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          type="button"
                          className="production-password-toggle"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <><EyeSlash className="me-2" />Hide</> : <><Eye className="me-2" />Show</>}
                        </Button>
                      </InputGroup>
                      <Form.Control.Feedback type="invalid">
                        Please provide a password.
                      </Form.Control.Feedback>
                    </Form.Group>
                  ) : (
                    <div className="production-inline-note production-form-grid-single">
                      Password changes are not part of this modal, so editing here will only update identity and access.
                    </div>
                  )}
                </div>
              </div>

              <div className="production-modal-section-card">
                <div className="production-modal-section-head">
                  <div>
                    <h4>Roles & Permissions</h4>
                    <p>Turn on the sections this user should access, then choose which actions are allowed in each one.</p>
                  </div>
                </div>

                <Accordion className="production-role-accordion">
                  {rolesConfig.map((roleOrGroup, i) => {
                    const renderRoleContent = (roleName) => {
                      const isActive = activeRoles.includes(roleName);

                      return (
                        <div
                          key={roleName}
                          className={`production-role-card ${isActive ? "production-role-card-active" : ""}`}
                        >
                          <div className="production-role-card-head">
                            <div>
                              <h5>{roleName}</h5>
                              {isActive ? <p>Permissions can be adjusted below.</p> : null}
                            </div>
                            <Form.Check
                              type="switch"
                              id={`role-switch-${roleName}`}
                              label={isActive ? "Enabled" : "Disabled"}
                              checked={isActive}
                              onChange={(e) => handleRoleToggle(roleName, e.target.checked)}
                            />
                          </div>

                          <div className="production-role-permissions">
                            {permissionsConfig.map((permission) => (
                              <Form.Check
                                key={permission.name}
                                type="checkbox"
                                id={`check-${roleName}-${permission.name}`}
                                label={permission.name}
                                checked={formData.permissions?.[roleName]?.includes(permission.name) || false}
                                onChange={(e) =>
                                  handlePermissionChange(roleName, permission.name, e.target.checked)
                                }
                                disabled={!isActive}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    };

                    if (typeof roleOrGroup === "string") {
                      return renderRoleContent(roleOrGroup);
                    }

                    return (
                      <Accordion.Item eventKey={i} key={i} className="production-role-group-card">
                        <Accordion.Header>{roleOrGroup.name}</Accordion.Header>
                        <Accordion.Body>
                          <div className="production-role-grid">
                            {roleOrGroup.subRoles.map((subRole) => renderRoleContent(subRole))}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseUserModal}>
              Cancel
            </Button>
            {isEdit?<Button variant="primary" type="submit" disabled={isUpdateLoading}>
              {/* {currentUser ? "Save Changes" : "Create Account"} */}
              {isLoading?"Updating user...":"Update user"}
            </Button>:<Button variant="primary" type="submit" disabled={isLoading}>
              {/* {currentUser ? "Save Changes" : "Create Account"} */}
              {isLoading?"Creating account...":"Create Account"}
            </Button>}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Permissions Modal */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} centered scrollable dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-shaded me-2"></i>Permissions for{" "}
            {userToView?.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToView ? (
            <UserPermissionsDisplay permissions={userToView.permissions} />
          ) : (
            <p>No permissions found.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered backdrop="static" scrollable dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the user "{userToDelete?.username}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseConfirmModal}>
            Cancel
          </Button>
          {
            isDeleteLoading? <Button variant="danger">
            <CircularProgress
             size={16}
              sx={{
          color: '#f6eff5ff', // Apply a custom pink color
        }}
               />&nbsp;&nbsp; Deleting
          </Button>: <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
          }
         
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <Alert
          variant="success"
          onClose={() => setShowToast(false)}
          dismissible
          className="position-fixed bottom-0 end-0 m-3"
          style={{ zIndex: 1050 }}
        >
          {toastMessage}
        </Alert>
      )}
    </Container>
  );
}
