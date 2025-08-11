import React, { useState, useEffect, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
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
  useChangePasswordMutation,
  useEditAccountMutation,
  useDeleteUserMutation,
} from "../../features/api/AccountsSlice";
import { selectRoles } from "../../auth/authSlice";
import { Lock, LockFill, PencilSquare, TrashFill } from "react-bootstrap-icons";
// --- Data and Configuration ---
const rolesConfig = [
  {
    name: "Production",
    subRoles: ["Employees", "Raw Materials", "Expenses", "Orders"],
  },
  "Dashboard",
  "Sales Desk",
  "Products",
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
      email: cleanUsername.includes("@") ? cleanUsername : null,
      permissions: newPermissions,
    };
  });
}

// const initialUsers = [
//   {
//     id: 1,
//     username: "admin_user",
//     email: "admin@example.com",
//     permissions: {
//       Dashboard: ["View"],
//       Employees: ["View", "Create", "Update"],
//       "Raw Materials": ["View", "Create", "Update"],
//       Expenses: ["View", "Create"],
//       Orders: ["View"],
//       Products: ["View", "Create", "Update", "Delete"],
//       Settings: ["View", "Update"],
//     },
//   },
//   {
//     id: 2,
//     username: "sales_person",
//     email: "sales@example.com",
//     permissions: {
//       "Sales Desk": ["View", "Create"],
//       Customers: ["View", "Create", "Update"],
//       Sales: ["View", "Create"],
//       "Credit Sales": ["View", "Create"],
//     },
//   },
// ];


// --- Main App Component ---
export default function AdminAccountManager() {
  const accounts = useSelector(selectAccounts);
  const [createUser, { isLoading, isSuccess }] = useRegisterMutation();
  const [deleteUser, { isLoading: isDeleteLoading, isSuccess: isDeleteSuccess, isError: isDeleteError, error:deleteError }] = useDeleteUserMutation();
//   const initialUsers = transformUsers(accounts);
const users = useMemo(() => transformUsers(accounts), [accounts]);

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
    setValidated(false);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setCurrentUser(null);
    setFormData({});
    setActiveRoles([]);
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
      const dataToSubmit = { ...formData };
      delete dataToSubmit.password; // Don't store password in the user object
      try {
        const data = await createUser({
          ...formData,
          roles: _roles,
          permissions: _permissions,
          // password: generatedPassword,
          // name: _name.split("@")[0],
          accountType: "sharedAccount",
        }).unwrap();
        //   downloadAccountSignInPDF(newAccount.name);
        //   setNewAccount({ name: "", roles: [],password:"",email:"" });
        setFormData({});
        toast.success(data.message);
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
    <Container className="py-4" style={{ backgroundColor: "#f8f9fa" }}>
      <header className="mb-4">
        <h1 className="d-flex align-items-center gap-3">
          <i className="bi bi-shield-check"></i> Inventory User Management
        </h1>
        <p className="text-muted">
          Create and manage user accounts with role-based permissions.
        </p>
      </header>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-people"></i> Manage Users
          </h2>
          <Button variant="primary" onClick={() => handleOpenUserModal()}>
            <i className="bi bi-person-plus-fill me-2"></i>Create New User
          </Button>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover className="align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>Assigned Roles</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
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
                    {/* <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleOpenUserModal(user)}
                    >
                      <PencilSquare />
                    </Button> */}
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
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* User Form Modal */}
      <Modal
        show={showUserModal}
        onHide={handleCloseUserModal}
        size="lg"
        backdrop="static"
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
            <Row>
              <Col md={4} >
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    autocomplete="new-username"
                      readonly 
  onfocus="this.removeAttribute('readonly');"
                    value={formData.username || ""}
                    onChange={handleFormInputChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a username.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4} >
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    autocomplete="new-email"
                      readonly 
  onfocus="this.removeAttribute('readonly');"
                    value={formData.email || ""}
                    onChange={handleFormInputChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid email.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4} >
                {!currentUser && (
              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  autocomplete="new-password"
                    readonly 
  onfocus="this.removeAttribute('readonly');"
                  onChange={handleFormInputChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a password.
                </Form.Control.Feedback>
              </Form.Group>
            )}
              </Col>
            </Row>
          <Row>
 <div className="mt-4 mb-3">
             <h3 className="h5 mb-3 mt-5">
              <i className="bi bi-key-fill me-2"></i>Roles & Permissions
            </h3>
            </div>
          </Row>
          
            <Accordion className="mt-4">
              {rolesConfig.map((roleOrGroup, i) => {
                const renderRoleContent = (roleName) => (
                  <div key={roleName} className="mb-3">
                    <Form.Check
                      type="switch"
                      id={`role-switch-${roleName}`}
                      label={<strong>{roleName}</strong>}
                      checked={activeRoles.includes(roleName)}
                      onChange={(e) =>
                        handleRoleToggle(roleName, e.target.checked)
                      }
                    />
                    {activeRoles.includes(roleName) && (
                      <Card className="mt-2">
                        <Card.Body className="ps-4">
                          <Row>
                            {permissionsConfig.map((p) => (
                              <Col key={p.name} sm={6} md={3}>
                                <Form.Check
                                  type="checkbox"
                                  id={`check-${roleName}-${p.name}`}
                                  label={p.name}
                                  checked={
                                    formData.permissions?.[roleName]?.includes(
                                      p.name
                                    ) || false
                                  }
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      roleName,
                                      p.name,
                                      e.target.checked
                                    )
                                  }
                                />
                              </Col>
                            ))}
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                );

                if (typeof roleOrGroup === "string") {
                  return renderRoleContent(roleOrGroup);
                } else {
                  return (
                    <Accordion.Item eventKey={i} key={i}>
                      <Accordion.Header>{roleOrGroup.name}</Accordion.Header>
                      <Accordion.Body>
                        {roleOrGroup.subRoles.map((subRole) =>
                          renderRoleContent(subRole)
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                }
              })}
            </Accordion>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseUserModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {currentUser ? "Save Changes" : "Create Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Permissions Modal */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} centered>
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
      <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
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

// import React, { useState, useEffect } from "react";
// import { Table, Form, Button, Modal } from "react-bootstrap";
// import { useRegisterMutation } from "../../auth/authApiSlice";
// import { useSelector } from "react-redux";
// import { selectAccounts, useChangePasswordMutation, useEditAccountMutation, useDeleteUserMutation } from "../../features/api/AccountsSlice";
// import { selectRoles } from "../../auth/authSlice";
// import { jsPDF } from "jspdf";
// import { set } from "date-fns";
// import PermissionWrapper from "../../auth/PermissionWrapper";

// const rolesList = ["Inventory Manager", "Production Manager", "Accountant", "Admin"];
// const permissionsList = ["Delete", "Edit", "create","export"];

// const AdminAccountManager = () => {
//   const accountsList = useSelector(selectAccounts);
//   const roles = useSelector(selectRoles);
//   const [accounts, setAccounts] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [newAccount, setNewAccount] = useState({ name: "", roles: [], permissions: [], email: "", password: "" });
//   const [editingAccount, setEditingAccount] = useState(null);
//   const [register, {isLoading, isSuccess}] = useRegisterMutation();
//   const [changePassword, {isLoading:changePasswordIsLoading, isSuccess:isChangePasswordSuccess}] = useChangePasswordMutation();
//   const [updateAccount, {isLoading:updateIsLoading, isSuccess:isUpdateSuccess}] = useEditAccountMutation();
//   const [deleteUser, {isLoading:isDeleteUserLoading, isSuccess:isDeleteUserSuccess}] = useDeleteUserMutation();

//   const [generatedPassword, setGeneratedPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [userId, setUserId] = useState("");

//   const [confirming, setConfirming] = useState(false);
//   const [countdown, setCountdown] = useState(5);

// console.log("Roles: "+roles);

//   const handleCreateAccount = () => {
//     setShowModal(false);
//     setNewAccount({ name: "", roles: [] });
//   };

//   const handleEditAccount = (id) => {
//     const account = accounts.find((acc) => acc.id === id);
//     setEditingAccount(account);
//     setShowModal(true);
//   };

//   const generatePassword = () => {
//     const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
//     let password = '';
//     for (let i = 0; i < 8; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     setGeneratedPassword(password);
//     setNewAccount({ ...newAccount, password: generatedPassword })
//     setShowPassword(true);
//   };

//   const handleUpdateAccount = () => {
//     setAccounts(accounts.map((acc) => (acc.id === editingAccount.id ? editingAccount : acc)));
//     setShowModal(false);
//     setEditingAccount(null);
//   };

//   const handleDeleteAccount = (id) => {
//     setAccounts(accounts.filter((acc) => acc.id !== id));
//   };

//   const handleInvalidateLink = (id) => {
//     setAccounts(accounts.map((acc) => (acc.id === id ? { ...acc, link: "Invalidated" } : acc)));
//   };

//   const handleRoleChange = (role, isChecked, account, setAccount) => {
//     if (isChecked) {
//       setAccount({ ...account, roles: [...account.roles, role] });
//     } else {
//       setAccount({ ...account, roles: account.roles.filter((r) => r !== role) });
//     }
//   };

//   const handlePermissions = (permit, isChecked, account, setAccount) => {
//     if (isChecked) {
//       setAccount({ ...account, permissions: [...account.permissions, permit] });
//     } else {
//       setAccount({ ...account, permissions: account.permissions.filter((r) => r !== permit) });
//     }
//   };

//   const handlePasswordReset = async (user_id, username) => {
//     setUserId(user_id);
//     generatePassword();
//     if(generatedPassword.length>0){
//       try{
//         const data = await changePassword({user_id, newPassword: generatedPassword }).unwrap();
//         downloadAccountSignInPDF(username);
//         setGeneratedPassword("");
//         setUserId("");
//             }catch(err){
//               console.log("Error occured: "+err);
//             }
//     }
//   }

// const downloadAccountSignInPDF = (username) => {
//   const doc = new jsPDF();

//   doc.setFontSize(16);
//   doc.text("Your Sign-In Credentials", 20, 30);

//   doc.setFontSize(12);
//   doc.text(`Username: ${username}`, 20, 50);
//   doc.text(`Password: ${generatedPassword}`, 20, 60);

//   doc.save(`signin_credentials_${username}.pdf`);
// };

//   const handleSubmit = async () => {
//     let _name = newAccount.name
//     try{
//       await register(
//       {
//         ... newAccount,
//         password: generatedPassword,
//         // name: _name.split("@")[0],
//          accountType: "sharedAccount",
//         }
//       ).unwrap();
//       downloadAccountSignInPDF(newAccount.name);
//       setNewAccount({ name: "", roles: [],password:"",email:"" });
//     } catch (err) {
//       // return <Alerts heading="An error occured during registration!" message={error}/>
//       if (!err.status) {
//         // setErrMsg('No Server Response')
//       window.alert("No Server Response")

//         // setShowError(true)
//     } else if (err.status === 400) {
//       window.alert("Check your credentials and try again.")
//         // setErrMsg('Missing Businessname or Password');
//         // setShowError(true)
//     } else if (err.status === 401) {
//       window.alert("Unauthorised")
//         // setErrMsg('Unauthorised');
//         // setShowError(true)
//     }
//     else if (err.status === 404) {
//       window.alert("Not Found")
//         // setErrMsg('Unauthorised');
//         // setShowError(true)
//     }
//     else if (err.status === 500) {
//       window.alert("Internal Server Error")
//         // setErrMsg('Unauthorised');
//         // setShowError(true)
//     }
//     else if (err.status === 503) {
//       window.alert("Service unavailable")
//         // setErrMsg('Unauthorised');
//         // setShowError(true)
//     }
//     else {
//       window.alert("Check your credentials and try again.")
//         // setErrMsg('Check your credentials and try again.');
//         // setShowError(true)
//         // errRef.current.focus();
//     }
//     }
//   }

//   const handleDeleteUser = async ()=> {
// if(userId){
//   try{
// const _delete = await deleteUser({user_id:userId}).unwrap();
// setUserId("");
//   }catch(error){
//     console.log("Error: "+ error);
//   }
// }
//   }

//   useEffect(() => {
//     let timer;
//     if (confirming) {
//       timer = setInterval(() => {
//         setCountdown(prev => {
//           if (prev === 1) {
//             setConfirming(false);
//             clearInterval(timer);
//             return 5;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [confirming]);

//   const handleClick = (id) => {
//     setUserId(id);
//     if (confirming) {
//       handleDeleteUser();
//       setConfirming(false);
//       setCountdown(5);
//     } else {
//       setConfirming(true);
//     }
//   };

//   return (
//     <div className="container mt-4">
//       <h2>Admin Account Manager</h2>
//       <div className="d-flex flex-row justify-content-between">
//      <div>
//       <PermissionWrapper required={['create']} children={<Button variant="primary" onClick={() => setShowModal(true)}>Create Account</Button>} />
//       </div>
//      {/* <div><Button variant="info" >Roles/Permisions</Button></div> */}
//       </div>

//       <Table striped bordered hover className="mt-3">
//         <thead className="table-dark">
//           <tr>
//             <th>Username</th>
//             <th>Roles</th>
//             <th>Permissions</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {accountsList.map((acc) => (
//             <tr key={acc.id}>
//               <td>{acc.username}</td>
//               <td>{acc.roles?.join(", ")}</td>
//               <td>{acc.permissions?.join(", ")}</td>
//               {/* <td>{acc.link}</td> */}
//               <td>

//                 {
//                 // changePasswordIsLoading?userId === acc.id? <Button variant="warning" size="sm"  >Resetting...</Button>:<Button variant="warning" size="sm"  >Reset password</Button>:
//                 // <Button variant="warning" size="sm" onClick={()=>handlePasswordReset(acc.id, acc.username)} >Reset password</Button>
//                 }
//                 {/* <Button variant="info" size="sm" onClick={() => handleEditAccount(acc.id)}>Edit</Button>{" "} */}
// <PermissionWrapper required={['delete']} children={        <Button
//       variant={confirming ? "warning" : "danger"}
//       size="sm"
//       onClick={() => handleClick(acc.id)}
//     >
//       {confirming ? userId === acc.id? `Click again (${countdown})` : "Delete":"Delete"}
//     </Button>} />
//                 {
//                 // isDeleteUserLoading?userId === acc.id? <Button variant="danger" size="sm"  >Deleting...</Button>:<Button variant="warning" size="sm"  >Delete</Button>:
//                 // <Button variant="danger" size="sm" onClick={()=>handleDeleteUser(acc.id)} >Delete</Button>
//                 }
//               </td>
//             </tr>
//          ))}
//         </tbody>
//       </Table>

//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>{editingAccount ? "Edit Account" : "Create New Account"}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group>
//               <Form.Label>User Name/Email</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={editingAccount ? editingAccount.name : newAccount.name}
//                 onChange={(e) => editingAccount ? setEditingAccount({ ...editingAccount, name: e.target.value, email: e.target.value }) : setNewAccount({ ...newAccount, name: e.target.value, email: e.target.value  })}
//               />
//             </Form.Group>
//             {/* <Form.Group>
//               <Form.Label>Email</Form.Label>
//               <Form.Control
//                 type="email"
//                 value={editingAccount ? editingAccount.email : newAccount.email}
//                 onChange={(e) => editingAccount ? setEditingAccount({ ...editingAccount, email: e.target.value }) : setNewAccount({ ...newAccount, email: e.target.value })}
//               />
//             </Form.Group> */}
//             {/* <Form.Group>
//               <Form.Label>Password</Form.Label>
//               <Form.Control
//                 type="password"
//                 value={editingAccount ? editingAccount.password : newAccount.password}
//                 onChange={(e) => editingAccount ? setEditingAccount({ ...editingAccount, password: e.target.value }) : setNewAccount({ ...newAccount, password: e.target.value })}
//               />
//             </Form.Group> */}
//                  <Button variant="secondary" onClick={generatePassword} className="mt-3">
//           Generate Password
//         </Button>

//         {showPassword && (
//           <div className="mt-3">
//             <p><strong>Generated Password:</strong> <code>{generatedPassword}</code></p>
//             <p><em>Please copy this password now—it will not be shown again.</em></p>
//           </div>
//         )}
//             <Form.Group className="mt-2">
//               <Form.Label>Roles</Form.Label>
//               {rolesList.map((role) => (
//                 <Form.Check
//                   key={role}
//                   type="checkbox"
//                   label={role}
//                   checked={(editingAccount ? editingAccount.roles : newAccount.roles).includes(role)}
//                   onChange={(e) => editingAccount ? handleRoleChange(role, e.target.checked, editingAccount, setEditingAccount) : handleRoleChange(role, e.target.checked, newAccount, setNewAccount)}
//                 />
//               ))}
//             </Form.Group>
//             <Form.Group className="mt-2">
//               <Form.Label>Permisions</Form.Label>
//               {permissionsList.map((permit) => (
//                 <Form.Check
//                   key={permit}
//                   type="checkbox"
//                   label={permit}
//                   checked={(editingAccount ? editingAccount?.permissions : newAccount?.permissions)?.includes(permit)}
//                   onChange={(e) => editingAccount ? handlePermissions(permit, e.target.checked, editingAccount, setEditingAccount) : handlePermissions(permit, e.target.checked, newAccount, setNewAccount)}
//                 />
//               ))}
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
//           {
//             isLoading?<Button variant="primary" >
//            Saving...
//           </Button>:<Button variant="primary" onClick={editingAccount ? handleUpdateAccount : handleSubmit}>
//             {editingAccount ? "Update" : "Create"}
//           </Button>
//           }
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default AdminAccountManager;
