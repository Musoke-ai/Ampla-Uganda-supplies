// ExportCSV.js
import React from 'react';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { FileExcel } from 'react-bootstrap-icons';
import { ImportExport } from '@mui/icons-material';

const ExportCSV = ({ data, fileName }) => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(blob, fileName + fileExtension);
    };

    return (
        <button className='btn btn-danger' onClick={exportToCSV}><ImportExport
        /> Export to Excel </button>
    );
};

export default ExportCSV;
