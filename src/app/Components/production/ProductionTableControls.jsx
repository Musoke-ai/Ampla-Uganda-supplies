import React from "react";
import { Form, Pagination } from "react-bootstrap";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50];

function getVisiblePages(currentPage, totalPages) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function paginateItems(items = [], currentPage = 1, rowsPerPage = 10) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeRowsPerPage = Math.max(1, Number(rowsPerPage) || 10);
  const totalPages = Math.max(1, Math.ceil(safeItems.length / safeRowsPerPage));
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);
  const startIndex = (safePage - 1) * safeRowsPerPage;
  const endIndex = startIndex + safeRowsPerPage;

  return {
    currentPage: safePage,
    rowsPerPage: safeRowsPerPage,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, safeItems.length),
    paginatedItems: safeItems.slice(startIndex, endIndex),
  };
}

export function ProductionPagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

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

export function ProductionTableFooter({
  totalItems = 0,
  currentPage = 1,
  rowsPerPage = 10,
  totalPages = 1,
  onPageChange,
  onRowsPerPageChange,
  itemLabel = "records",
  summary,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) {
  const safeTotal = Number(totalItems) || 0;
  const safeRowsPerPage = Math.max(1, Number(rowsPerPage) || 10);
  const start = safeTotal === 0 ? 0 : (currentPage - 1) * safeRowsPerPage + 1;
  const end = Math.min(currentPage * safeRowsPerPage, safeTotal);

  return (
    <div className="workspace-table-footer production-table-footer">
      <div className="workspace-table-summary">
        Showing {start} to {end} of {safeTotal} {itemLabel}
        {summary ? <span className="workspace-summary-spacer">{summary}</span> : null}
      </div>
      <div className="production-table-footer-actions">
        <Form.Select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value) || 10)}
          className="production-table-page-size"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </Form.Select>
        <div className="workspace-pagination-row">
          <ProductionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
