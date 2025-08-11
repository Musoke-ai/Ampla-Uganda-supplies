import React, { useState, useMemo } from 'react';
import { Table, Form, InputGroup, Row, Col, Button, Spinner, Dropdown } from 'react-bootstrap';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import ReactPaginate from 'react-paginate';
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
// import 'bootstrap/dist/css/bootstrap.min.css';
import { MenuApp, Pencil, ThreeDots, List, BarChart, InfoCircle } from 'react-bootstrap-icons';
import { Menu, MenuList } from '@mui/material';
import CategoryExcerpty from '../excerpts/CategoryExcerpty';

const InventoryTable = ({ data, showDetails, setItemId, showStats }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [isExporting, setIsExporting] = useState(false);

  const columns = useMemo(
    () => [
      // { Header: 'Item ID', accessor: 'itemId' },
      { Header: 'Name', accessor: 'itemName' },
      { Header: 'Category', accessor: '',
        Cell: ({ row }) => {
          const catId = row.original.itemCategoryId;
          return (
            <div>
              <CategoryExcerpty catId={catId} />
            {/* {itemId} */}
            </div>
          );
        },
       },
      { Header: 'Model', accessor: 'itemModel' },
      { Header: 'Quality', accessor: 'itemQuality' },
      { Header: 'Quantity', accessor: 'itemQuantity' },
      // { Header: 'Condition', accessor: 'itemCondition' },
      { Header: 'Size', accessor: 'itemSize' },
      { Header: 'Stock Price', accessor: 'itemStockPrice' },
      { Header: 'Least Price', accessor: 'itemLeastPrice' },
      { Header: 'Notes', accessor: 'itemNotes' },
      { Header: 'Action',accessor: '',
        Cell: ({ row }) => {
          const itemId = row.original.itemId;
          return (
            <div>
              <Dropdown>
      {/* Dropdown Toggle with ThreeDots icon */}
      <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center">
        <ThreeDots size={20} />
      </Dropdown.Toggle>

      {/* Dropdown Menu */}
      <Dropdown.Menu>
        {/* Option 1: View Stats */}
        <Dropdown.Item href="#view-stats" className="d-flex align-items-center"
         onClick={()=>{
          showStats(true);
          setItemId(itemId);
          }}
        >
          <BarChart size={18} className="me-2" />
          View Stats
        </Dropdown.Item>

        {/* Option 2: View Details */}
        <Dropdown.Item href="#view-details" className="d-flex align-items-center" 
        onClick={()=>{
          showDetails(true);
          setItemId(itemId);
          }}
        >
          <InfoCircle size={18} className="me-2" />
          View Details
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>

             {/* <Button className='btn-sm bg-transparent btn-light' onClick={()=>{
              showDetails(true);
              setItemId(itemId);
              }}><ThreeDots className='text-dark'/></Button> */}
            </div>
          );
        },
       },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    state: { globalFilter },
  } = useTable({
    columns,
    data,
    initialState: { pageSize },
  }, useGlobalFilter, useSortBy);

  const handlePageClick = ({ selected }) => setPageIndex(selected);

  const paginatedRows = useMemo(
    () => rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [rows, pageIndex, pageSize]
  );

  const exportToPDF = () => {
    setIsExporting(true);
    const doc = new jsPDF();
    doc.text("Inventory Table", 20, 10);
    const tableData = rows.map(row => row.original);
    const headers = columns.map(col => col.Header);
    const data = tableData.map(row => headers.map(header => row[header.toLowerCase().replace(/ /g, "")]));
    doc.autoTable({ head: [headers], body: data });
    doc.save("inventory.pdf");
    setIsExporting(false);
  };

  const exportToJSON = () => {
    setIsExporting(true);
    const blob = new Blob([JSON.stringify(rows.map(row => row.original), null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory.json";
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="container mt-4">
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>Search:</InputGroup.Text>
            <Form.Control
              type="text"
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search in table..."
            />
          </InputGroup>
        </Col>
        <Col md={3} className="text-end">
          {/* <div className="d-flex justify-content-end align-items-center">
            {isExporting && <Spinner animation="border" size="sm" className="me-2" />}
            <Button variant="primary" className="me-2" onClick={exportToPDF} disabled={isExporting}>Export PDF</Button>
            <CSVLink
              data={rows.map(row => row.original)}
              headers={columns.map(col => ({ label: col.Header, key: col.accessor }))}
              filename="inventory.csv"
              className="btn btn-primary me-2"
            >
              Export CSV
            </CSVLink>
            <Button variant="primary" className="me-2" onClick={exportToJSON} disabled={isExporting}>Export JSON</Button>
          </div> */}
          <Form.Select
            value={pageSize}
            style={{height:'35px'}}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((size) => (
              <option key={size} value={size}>
                Show {size} rows
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2} className='ms-5 '>
        <Button className='btn-sm bg-transparent btn-dark ms-5'>
        <List className='text-dark'/>
        </Button>
        </Col>
      </Row>

      <Table striped bordered hover responsive {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {paginatedRows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>

      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={Math.ceil(rows.length / pageSize)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageClick}
        containerClassName={"pagination justify-content-center"}
        pageClassName={"page-item"}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        breakClassName={"page-item"}
        breakLinkClassName={"page-link"}
        activeClassName={"active"}
      />
    </div>
  );
};

export default InventoryTable;

