import React from "react";

const Alerts = ({ trigger, majorMsg, manorMsg, action, close }) => {
  return (
    <div>
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>You Are About to Delete an Item from the inventory</strong>{" "}
        Click ok to Delete or Cancel to abort.
        <div class="d-flex flex-row justify-content-between align-items-center mt-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            onClick={() => {
            //   handleDelete(item.itemId);
            }}
          >
            {" "}
            Ok{" "}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            // onClick={handleAlert}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
