import React from "react";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useEffect, useState } from "react";
const Alerts = ({ message, heading, autoHide, delay, variant, action, payload }) => {
  const [show, setShow] = useState(true);
  const _delay = delay ? delay : 5000;

  const hideAlert = () => {
    setTimeout(() => {
      setShow(false);
    }, _delay);
  };

  useEffect(() => {
    if(autoHide === true){
        hideAlert();
    }
    
  }, []);

  return (
    <Alert variant={variant} show={show}>
      <Alert.Heading>{heading}</Alert.Heading>
      <p>{message}</p>
      <hr />
      {action?
      <div className="d-flex flex-row justify-content-between">
        <Button
          onClick={() => {
            action(payload);
          }}
          variant="outline-primary"
        >
         Ok
        </Button>
        <Button
          onClick={() => {
            setShow(false);
          }}
          variant="outline-success"
        >
          close
        </Button>
      </div>:

      <div className="d-flex justify-content-end">
        <Button
          onClick={() => {
            setShow(false);
          }}
          variant="outline-success"
        >
          close
        </Button>
      </div>
}
    </Alert>
  );
};

export default Alerts;
