import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button, Card, Form, InputGroup, Pagination, Table } from "react-bootstrap";
import { Download, Search } from "react-bootstrap-icons";

const palette = {
  surface: "var(--ampla-surface-bg, #ffffff)",
  border: "var(--ampla-border-color, #e7efe9)",
  text: "var(--ampla-text-color, #15202b)",
  muted: "var(--ampla-muted-color, #6f7d8c)",
  green: "var(--ampla-accent-color, #2f8f57)",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: palette.surface,
  boxShadow: palette.shadow,
  border: `1px solid ${palette.border}`,
};

const toolbarButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.1rem",
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  backgroundColor: palette.surface,
  color: palette.text,
  fontWeight: 700,
  boxShadow: "none",
};

const headerCellStyle = {
  color: palette.text,
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: "nowrap",
  backgroundColor: palette.surface,
  paddingTop: 18,
  paddingBottom: 18,
};

const bodyCellStyle = {
  color: palette.text,
  fontSize: 14,
  paddingTop: 18,
  paddingBottom: 18,
  verticalAlign: "middle",
};

function TablePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5
  );

  return (
    <Pagination className="mb-0">
      <Pagination.Prev
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      />
      {pages.map((pageNumber) => (
        <Pagination.Item
          key={pageNumber}
          active={pageNumber === currentPage}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Pagination.Item>
      ))}
      <Pagination.Next
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      />
    </Pagination>
  );
}

const HistoryTable = ({ historyData = [], itemsData = [], companyName }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const mergedData = useMemo(
    () =>
      historyData.map((history) => {
        const item = itemsData.find((entry) => String(entry.itemId) === String(history.historyItemId));
        return {
          ...history,
          itemName: item?.itemName || "Unknown",
          itemModel: item?.itemModel || "Unknown",
          itemNotes: item?.itemNotes || "No notes",
        };
      }),
    [historyData, itemsData]
  );

  const filteredData = useMemo(() => {
    const normalizedTerm = searchTerm.toLowerCase();
    return mergedData.filter((record) => {
      const formattedDate =
        record.historyDateCreated && !Number.isNaN(new Date(record.historyDateCreated))
          ? format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss")
          : "N/A";

      return (
        record.itemName.toLowerCase().includes(normalizedTerm) ||
        record.historyAction?.toLowerCase().includes(normalizedTerm) ||
        formattedDate.toLowerCase().includes(normalizedTerm) ||
        String(record.historyDetails || "").toLowerCase().includes(normalizedTerm)
      );
    });
  }, [mergedData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const exportToPDF = () => {
    const doc = new jsPDF();
    const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    doc.text(`${companyName}`, 14, 12);
    doc.text(`Report generated on: ${currentDate}`, 14, 20);

    doc.autoTable({
      startY: 28,
      head: [["Date", "Item Name", "Model", "Notes", "Action", "Details"]],
      body: filteredData.map((record) => [
        record.historyDateCreated && !Number.isNaN(new Date(record.historyDateCreated))
          ? format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss")
          : "N/A",
        record.itemName,
        record.itemModel,
        record.itemNotes,
        record.historyAction,
        record.historyDetails,
      ]),
      headStyles: {
        fillColor: [47, 143, 87],
      },
    });

    doc.save("history-report.pdf");
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
  };

  return (
    <Card style={sectionCardStyle}>
      <Card.Body className="p-3 p-lg-4">
        <div className="workspace-section-head">
          <div>
            <h3 className="workspace-section-title">History Log</h3>
            <p className="workspace-section-copy">
              Search stock events by item, action, or date and export the filtered audit trail.
            </p>
          </div>
          <div className="workspace-page-actions">
            <Form.Select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              style={{ minHeight: 44, borderRadius: 16, borderColor: palette.border, minWidth: 120 }}
            >
              <option value="5">5 rows</option>
              <option value="10">10 rows</option>
              <option value="20">20 rows</option>
              <option value="50">50 rows</option>
            </Form.Select>
            <Button variant="light" onClick={exportToPDF} style={toolbarButtonStyle}>
              <Download className="me-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <InputGroup className="workspace-search-group mt-3">
          <InputGroup.Text className="workspace-search-adornment">
            <Search />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search by date, item, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="workspace-search-input"
          />
        </InputGroup>

        <div className="workspace-table-wrap">
          <Table hover className="align-middle mb-0 workspace-modern-table">
            <thead>
              <tr>
                <th style={headerCellStyle}>Date</th>
                <th style={headerCellStyle}>Item Name</th>
                <th style={headerCellStyle}>Model</th>
                <th style={headerCellStyle}>Notes</th>
                <th style={headerCellStyle}>Action</th>
                <th style={headerCellStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record) => (
                <tr key={record.historyId}>
                  <td style={bodyCellStyle}>
                    {record.historyDateCreated && !Number.isNaN(new Date(record.historyDateCreated))
                      ? format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss")
                      : "N/A"}
                  </td>
                  <td style={bodyCellStyle}>{record.itemName}</td>
                  <td style={bodyCellStyle}>{record.itemModel}</td>
                  <td style={bodyCellStyle}>{record.itemNotes}</td>
                  <td style={bodyCellStyle}>{record.historyAction}</td>
                  <td style={bodyCellStyle}>{record.historyDetails}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="workspace-table-footer">
          <div className="workspace-table-summary">
            Showing <strong>{filteredData.length ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to{" "}
            <strong>{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong> of{" "}
            <strong>{filteredData.length}</strong> history records
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default HistoryTable;
