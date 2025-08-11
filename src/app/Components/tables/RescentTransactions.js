import React from "react";
import { Table } from "react-bootstrap";
import CurrencyFormat from "react-currency-format";

const RecentTransactions = ({data,limit}) => {
  const transactions = data;

  return (
    <div style={{ padding: "20px" }}>
      <Table hover>
        <thead>
          <tr>
            <th>TID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Transaction Type</th>
            <th>Sales/Debt Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.slice(0,limit).map((transaction, index) => (
            <tr key={index} >
              <td>SR{transaction?.SR_ID}</td>
              <td className="text-muted">{transaction?.customer}</td>
              <td className="text-muted">{transaction?.formattedSaleDate}</td>
              <td>Sales</td>
              <td>
              <CurrencyFormat
                  value={transaction?.totalCost}
                  displayType={'text'}
                  thousandSeparator={true}
                  prefix={'UGX'}
                />
                </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default RecentTransactions;
