import React from 'react';
import { useRef } from 'react';
import data from '../Data';

let columns = Object.keys(data[0]);
let values = Object.values(data);

const Table = () => {

  const showData = values.map((value) => {
    return(
      <tr >
        {
          columns.map((column) => {
            return (
              <td>{value[column]}</td>
            )
          })
        }
      </tr>
     )
    
  })
  

  return (
    <div>
        <table className="table">
        <thead>
         <tr>
     {
        columns.map((column,index) =>{
            return <th key={index}  >{column}</th>
        })
     }
        </tr> 
        </thead>
        <tbody >
       {showData}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
