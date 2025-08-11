import { useState } from "react";
import { Dropdown, Image, Modal, Form, Button } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { selectUserId } from "../../auth/authSlice";
import { selectAccounts } from "../../features/api/AccountsSlice";
import { useSelector } from "react-redux";
import Person from "@mui/icons-material/Person";


const UserAvatar = ({ user, onLogout, onChangePassword,logout }) => {
  const userId = useSelector(selectUserId);
  const accounts = useSelector(selectAccounts);

  // const userName = users?.filter(user => Number(user?.id) === Number(userId))[0].username;
  const userName = accounts?.find(account => Number(account?.id) === Number(userId))?.username;
  // console.log("user: "+Object.keys(accounts[0]));
  console.log("userName: "+userName);
  console.log("userId: "+userId);
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePasswordChange = () => {
    onChangePassword(oldPassword, newPassword);
    setShowModal(false);
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <>
      <Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)}>
        <Dropdown.Toggle 
          as="div" 
          id="avatar-dropdown" 
          className="border-0 bg-transparent d-flex align-items-center text-success" 
          style={{ cursor: "pointer" }}
        >
          <Person size={25} className='text-white' alignmentBaseline="center" />
        </Dropdown.Toggle>

        <Dropdown.Menu align="end">
          {/* <Dropdown.Item onClick={() => setShowModal(true)}>{userName}</Dropdown.Item> */}
          <Dropdown.Item >{userName}</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Change Password Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Old Password</Form.Label>
              <Form.Control 
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                placeholder="Enter old password" 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password" 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handlePasswordChange}>Change Password</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserAvatar;
