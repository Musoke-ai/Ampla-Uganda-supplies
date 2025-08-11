import { useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useSelector } from 'react-redux';
import { selectStatistics } from '../../features/api/statisticsSlice';
import { Line } from 'react-chartjs-2';
import { Table, Container } from 'react-bootstrap';
import ProductExcerpty from '../excerpts/ProductExcerpty';

function ProductStats({show, setShow, itemId}) {

   // Sample data for sales statistics
   const salesData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Sales (Units)',
        data: [50, 75, 60, 90, 120, 100],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Data for the table
  const stats = {
    debtedQuantity: 10,
    debtedAmount: 500,
    stockQuantity: 200,
    stockAmount: 10000,
    salesQuantity: 300,
    salesAmount: 15000,
    stockedQuantity: 400,
    stockedAmount: 20000,
  };

  const statistics = useSelector(selectStatistics);
  const statsPerItem = statistics.filter(stat => Number(stat.statItemId) === Number(itemId))[0];

  const handleClose = () => setShow(false);

  return (
    <>
      <Offcanvas show={show} onHide={handleClose} placement='end'>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title><h4 className="text-center mb-4">Statistics for <ProductExcerpty itemId={statsPerItem?.statItemId} field='itemName' /></h4></Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
        {/* Product Stats go here */}
        {/* {
          statsPerItem.map((item, index) => {
            return(
<div>
  {item.statItemStockWorth}
</div>
          )

          })
        } */}

<Container className="mt-1">
      {/* Line Graph */}
      <div className="mb-5">
        <Line
          data={salesData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Months',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Units Sold',
                },
                beginAtZero: true,
              },
            },
          }}
        />
      </div>

      {/* Statistics Table */}
      <h4 className="mb-3">Detailed Statistics</h4>
      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Metric</th>
            <th>Quantity</th>
            <th>Amount (UGX)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Debted</td>
            <td>{statsPerItem?.statItemIndebt}</td>
            <td>{statsPerItem?.statItemIndebtWorth}</td>
          </tr>
          {/* <tr>
            <td>2</td>
            <td>Stock</td>
            <td>{stats.stockQuantity}</td>
            <td>{stats.stockAmount}</td>
          </tr> */}
          <tr>
            <td>2</td>
            <td>Sales</td>
            <td>{statsPerItem?.statItemSales}</td>
            <td>{statsPerItem?.statItemSalesWorth}</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Stock</td>
            <td>{statsPerItem?.statItemStock}</td>
            <td>{statsPerItem?.statItemStockWorth}</td>
          </tr>
        </tbody>
      </Table>
    </Container>

        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default ProductStats;