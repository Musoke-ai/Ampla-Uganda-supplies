import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Form, InputGroup, Modal, Table } from "react-bootstrap";
import { LinearProgress } from "@mui/material";
import { Delete, Edit, Search } from "@mui/icons-material";
import { Building, GeoAlt, PersonBadge } from "react-bootstrap-icons";
import { ArrowDown, ArrowUp } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  selectBranches,
  useAddBranchMutation,
  useDeleteBranchMutation,
  useGetBranchesQuery,
  useUpdateBranchMutation,
} from "../../features/api/branchesSlice";
import { useSettings } from "../Settings";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";
import { paginateItems, ProductionTableFooter } from "../production/ProductionTableControls";
import "./WorkspacePages.css";

const searchableFields = [
  "branchName",
  "branchCode",
  "branchLocation",
  "branchManager",
  "branchContact",
  "branchEmail",
];

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: "#ffffff",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
  border: "1px solid #e7efe9",
};

const emptyBranchState = {
  branchId: "",
  branchName: "",
  branchCode: "",
  branchLocation: "",
  branchContact: "",
  branchEmail: "",
  branchManager: "",
  branchStatus: 1,
  branchDescription: "",
  allowDebtSales: "inherit",
};

const debtSalePolicyLabel = (value, globalSetting = true) => {
  if (value === null || value === undefined || value === "" || value === "inherit") {
    return globalSetting ? "Inherits global: enabled" : "Inherits global: disabled";
  }

  return Number(value) === 1 || value === true || value === "true"
    ? "Enabled for branch"
    : "Disabled for branch";
};

const formatApiError = (error, fallback) => {
  const message = error?.data?.message;
  const errors = error?.data?.errors;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (message && typeof message === "object") {
    return Object.values(message).filter(Boolean).join(" ");
  }

  if (errors && typeof errors === "object") {
    return Object.values(errors).filter(Boolean).join(" ");
  }

  return error?.error || fallback;
};

const MetricCard = ({ icon, title, value, note }) => (
  <div className="workspace-metric-card" style={sectionCardStyle}>
    <div
      className="workspace-metric-icon"
      style={{ backgroundColor: "#e8f5ec", color: "#2f8f57" }}
    >
      {icon}
    </div>
    <div className="workspace-metric-body">
      <div className="workspace-metric-title">{title}</div>
      <div className="workspace-metric-value">{value}</div>
      <div className="workspace-metric-note">{note}</div>
    </div>
  </div>
);

const BranchesPage = () => {
  const { settings } = useSettings();
  const theme = settings?.theme;

  const {
    isLoading: isBranchesLoading,
    isError: isBranchesError,
    error: branchesError,
  } = useGetBranchesQuery();

  const branches = useSelector(selectBranches) ?? [];
  const [addBranch, { isLoading: isAddLoading }] = useAddBranchMutation();
  const [updateBranch, { isLoading: isUpdateLoading }] = useUpdateBranchMutation();
  const [deleteBranch, { isLoading: isDeleteLoading }] = useDeleteBranchMutation();

  const validBranches = useMemo(
    () => branches.filter((branch) => branch?.branchName),
    [branches]
  );

  const {
    items: sortedBranches,
    requestSort,
    sortConfig,
    setSearchTerm,
    searchTerm,
  } = useTableSortSearch(validBranches, searchableFields, {
    key: "branchName",
    direction: "ascending",
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(emptyBranchState);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, rowsPerPage]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(sortedBranches.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [currentPage, rowsPerPage, sortedBranches.length]);

  const { totalPages, paginatedItems: paginatedBranches } = useMemo(
    () => paginateItems(sortedBranches, currentPage, rowsPerPage),
    [currentPage, rowsPerPage, sortedBranches]
  );

  const activeBranches = useMemo(
    () => sortedBranches.filter((branch) => Number(branch?.branchStatus) === 1).length,
    [sortedBranches]
  );

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === "ascending" ? <ArrowUp className="ms-1" /> : <ArrowDown className="ms-1" />;
  };

  const handleOpenCreate = () => {
    setCurrentBranch(emptyBranchState);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setCurrentBranch({
      branchId: branch?.branchId ?? "",
      branchName: branch?.branchName ?? "",
      branchCode: branch?.branchCode ?? "",
      branchLocation: branch?.branchLocation ?? "",
      branchContact: branch?.branchContact ?? "",
      branchEmail: branch?.branchEmail ?? "",
      branchManager: branch?.branchManager ?? "",
      branchStatus: Number(branch?.branchStatus ?? 1),
      branchDescription: branch?.branchDescription ?? "",
      allowDebtSales:
        branch?.allowDebtSales === null ||
        branch?.allowDebtSales === undefined ||
        branch?.allowDebtSales === ""
          ? "inherit"
          : String(Number(branch.allowDebtSales)),
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleOpenDelete = (branch) => {
    setCurrentBranch(branch);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentBranch(emptyBranchState);
    setIsEditing(false);
  };

  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setCurrentBranch(emptyBranchState);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCurrentBranch((prev) => ({
      ...prev,
      [name]: name === "branchStatus" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        const response = await updateBranch(currentBranch).unwrap();
        toast.success(response?.message || "Branch updated successfully.");
      } else {
        const response = await addBranch(currentBranch).unwrap();
        toast.success(response?.message || "Branch added successfully.");
      }

      handleCloseModal();
    } catch (error) {
      toast.error(formatApiError(error, "Branch action failed."));
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteBranch({ branchId: currentBranch?.branchId }).unwrap();
      toast.success(response?.message || "Branch deleted successfully.");
      handleCloseDelete();
    } catch (error) {
      toast.error(formatApiError(error, "Branch deletion failed."));
    }
  };

  const saveDisabled =
    !currentBranch.branchName.trim() ||
    isAddLoading ||
    isUpdateLoading;

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Branches Management</h2>
            <p className="workspace-page-subtitle">
              Create and maintain the company branch directory from one admin-only workspace.
            </p>
          </div>
          <div className="workspace-page-actions">
            <Button variant="primary" onClick={handleOpenCreate}>
              Add Branch
            </Button>
          </div>
        </header>

        <div className="workspace-metric-grid">
          <MetricCard
            icon={<Building size={18} />}
            title="Total Branches"
            value={sortedBranches.length}
            note="All branches registered in the system"
          />
          <MetricCard
            icon={<GeoAlt size={18} />}
            title="Active Branches"
            value={activeBranches}
            note={`${sortedBranches.length - activeBranches} inactive branch records`}
          />
          <MetricCard
            icon={<PersonBadge size={18} />}
            title="Managers Assigned"
            value={sortedBranches.filter((branch) => branch?.branchManager).length}
            note="Branches with a named manager contact"
          />
        </div>

        <section style={sectionCardStyle} className="production-shell-card">
          <div className="workspace-section-head">
            <div>
              <h3 className="workspace-section-title">Branch Directory</h3>
              <p className="workspace-section-copy">
                Search, update, and review operational branches without leaving the admin workspace.
              </p>
            </div>
          </div>

          <div className="production-filter-bar">
            <div className="production-filter-search">
              <InputGroup>
                <InputGroup.Text className={theme === "dark" ? "text-white" : "text-dark"}>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search branch name, code, manager, location, contact, or email"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </InputGroup>
            </div>
            <div className="production-stat-row">
              <span className="production-stat-chip">Branches: {sortedBranches.length}</span>
              <span className="production-stat-chip">Active: {activeBranches}</span>
            </div>
          </div>

          {isBranchesLoading ? <LinearProgress className="mb-3" /> : null}
          {isBranchesError ? (
            <Alert variant="warning" className="mb-3 production-safe-alert">
              {branchesError?.data?.message || "Branch data could not be loaded."}
            </Alert>
          ) : null}

          <div className="production-table-card">
            <div className="production-table-scroll">
              <Table hover responsive className="production-modern-table align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th onClick={() => requestSort("branchName")} className="production-sortable">
                      Branch {getSortIcon("branchName")}
                    </th>
                    <th onClick={() => requestSort("branchCode")} className="production-sortable">
                      Code {getSortIcon("branchCode")}
                    </th>
                    <th onClick={() => requestSort("branchManager")} className="production-sortable">
                      Manager {getSortIcon("branchManager")}
                    </th>
                    <th onClick={() => requestSort("branchLocation")} className="production-sortable">
                      Location {getSortIcon("branchLocation")}
                    </th>
                    <th onClick={() => requestSort("branchContact")} className="production-sortable">
                      Contact {getSortIcon("branchContact")}
                    </th>
                    <th onClick={() => requestSort("branchStatus")} className="production-sortable">
                      Status {getSortIcon("branchStatus")}
                    </th>
                    <th>Debt Sales</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBranches.length > 0 ? (
                    paginatedBranches.map((branch, index) => (
                      <tr key={branch.branchId}>
                        <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td>{branch.branchName}</td>
                        <td>{branch.branchCode || "--"}</td>
                        <td>{branch.branchManager || "--"}</td>
                        <td>{branch.branchLocation || "--"}</td>
                        <td>{branch.branchContact || branch.branchEmail || "--"}</td>
                        <td>
                          <span
                            className={`production-badge-soft ${
                              Number(branch.branchStatus) === 1
                                ? "production-badge-soft-success"
                                : "production-badge-soft-muted"
                            }`}
                          >
                            {Number(branch.branchStatus) === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{debtSalePolicyLabel(branch.allowDebtSales, settings?.allowDebtSales)}</td>
                        <td className="d-flex justify-content-center gap-1">
                          <Button
                            variant="info"
                            size="sm"
                            className="text-white"
                            onClick={() => handleOpenEdit(branch)}
                          >
                            <Edit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-white"
                            onClick={() => handleOpenDelete(branch)}
                          >
                            <Delete />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center">
                        No branch records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <ProductionTableFooter
              totalItems={sortedBranches.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              itemLabel="branches"
            />
          </div>
        </section>
      </div>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        className="branch-directory-modal"
        dialogClassName="production-modal-shell branch-directory-modal-dialog"
        backdropClassName="branch-directory-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Branch" : "Add Branch"}</Modal.Title>
        </Modal.Header>
        {isAddLoading || isUpdateLoading ? <LinearProgress /> : null}
        <Modal.Body>
          <Form>
            <div className="production-form-grid">
              <Form.Group>
                <Form.Label>Branch Name</Form.Label>
                <Form.Control
                  type="text"
                  name="branchName"
                  value={currentBranch.branchName}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Branch Code</Form.Label>
                <Form.Control
                  type="text"
                  name="branchCode"
                  value={currentBranch.branchCode}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Manager</Form.Label>
                <Form.Control
                  type="text"
                  name="branchManager"
                  value={currentBranch.branchManager}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="branchLocation"
                  value={currentBranch.branchLocation}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Contact</Form.Label>
                <Form.Control
                  type="text"
                  name="branchContact"
                  value={currentBranch.branchContact}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="branchEmail"
                  value={currentBranch.branchEmail}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="branchStatus"
                  value={currentBranch.branchStatus}
                  onChange={handleChange}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Debt Sales</Form.Label>
                <Form.Select
                  name="allowDebtSales"
                  value={currentBranch.allowDebtSales}
                  onChange={handleChange}
                >
                  <option value="inherit">
                    Inherit global ({settings?.allowDebtSales ? "enabled" : "disabled"})
                  </option>
                  <option value="1">Enable for this branch</option>
                  <option value="0">Disable for this branch</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="production-form-grid-single">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="branchDescription"
                  value={currentBranch.branchDescription}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saveDisabled}>
            {isEditing ? "Update Branch" : "Add Branch"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDelete}
        backdrop="static"
        className="branch-directory-modal"
        dialogClassName="branch-directory-modal-dialog"
        backdropClassName="branch-directory-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Branch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{currentBranch?.branchName}</strong> from the branch directory?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleteLoading}>
            Delete Branch
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BranchesPage;
