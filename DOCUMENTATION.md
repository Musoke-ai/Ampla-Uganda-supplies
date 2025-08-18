# Project Documentation: Receipt Generation Module

## 1. Project Overview

This project contains a React-based module for generating and displaying customer sales receipts. It provides functionality to:

- Display a live HTML preview of a receipt in a modal.
- Allow users to select receipt paper size (80mm or 58mm) for the preview.
- Print the HTML version of the receipt.
- Generate and download a PDF version of the receipt using `jsPDF` and `jspdf-autotable`.

The system is data-driven, taking in company information, customer details, cart items, and sale totals to populate the receipt. It uses Redux for state management to retrieve product and customer data.

## 2. File Breakdown

The core logic is split between two main files:

-   `d:\Ampla\ampla\ampla\src\app\Components\receipts\AmplaReceipt.js`: This is the primary component. It manages state, handles user interactions (previewing, printing, downloading), and renders the preview modal. It dynamically loads `jsPDF` scripts from a CDN.
-   `d:\Ampla\ampla\ampla\src\app\Components\receipts\Receipt.jsx`: This file contains a more direct-to-PDF template generator. It uses an installed `jspdf` package to manually draw each line and element of a receipt. It appears to be an alternative or perhaps an earlier implementation for PDF generation.

## 3. Component & Function Reference

### File: `d:\Ampla\ampla\ampla\src\app\Components\receipts\AmplaReceipt.js`

This file orchestrates the user-facing receipt functionality, including an HTML preview modal.

#### Components

-   **`AmplaReceipt({companyInfo, customerName, cart, saleDetails})`**
    -   **Description**: The main parent component. It handles loading necessary PDF generation scripts, manages the state for the preview modal, and passes data down to the preview component.
    -   **Props**:
        -   `companyInfo`: `object` - Contains business details like name, address, phone.
        -   `customerName`: `string` - The ID of the customer.
        -   `cart`: `array` - An array of item objects in the cart.
        -   `saleDetails`: `object` - Contains transaction totals, payment method, etc.

-   **`ReceiptPreviewModal({ show, onClose, onDownload, onPrint, ... })`**
    -   **Description**: A `forwardRef` component that displays an HTML preview of the receipt inside a modal. It includes controls for printing, downloading, and closing the modal, as well as changing the preview size between 58mm and 80mm.
    -   **Props**:
        -   `show`: `boolean` - Controls the visibility of the modal.
        -   `onClose`: `function` - Callback to close the modal.
        -   `onDownload`: `function` - Callback to trigger a PDF download.
        -   `onPrint`: `function` - Callback to trigger printing.
        -   `receiptSize`: `string` - The current paper size (`'80mm'` or `'58mm'`).
        -   `onSizeChange`: `function` - Callback when the paper size is changed.
        -   Other props like `cart`, `saleDetails`, `companyInfo`, `customerName` are passed through.

#### Helper & Handler Functions

-   **`formatCurrency(amount, currency)`**
    -   **Description**: A utility function to format a numeric amount into a standard currency string (e.g., `$1,234.56`).
    -   **Parameters**:
        -   `amount`: `number` - The value to format.
        -   `currency`: `string` - The currency code (defaults to 'UGX').
    -   **Returns**: `string` - The formatted currency string.

-   **`handlePrint()`** (within `AmplaReceipt`)
    -   **Description**: Opens a new browser window, injects the HTML content of the receipt preview, and triggers the browser's print dialog. It dynamically adds CSS to format the print output according to the selected paper size.

-   **`generateAndDownloadPdf()`** (within `AmplaReceipt`)
    -   **Description**: Uses the dynamically loaded `jsPDF` and `jspdf-autotable` libraries to construct a PDF document from the sale data and triggers a download.

### File: `d:\Ampla\ampla\ampla\src\app\Components\receipts\Receipt.jsx`

This file provides a set of functions and a component for programmatically creating a PDF receipt from scratch using an installed `jspdf` package.

#### Components

-   **`ReceiptTemplate({ data, companyInfo })`**
    -   **Description**: A `forwardRef` component designed to be controlled by a parent. It doesn't render any UI but exposes a `print()` method via its ref to trigger PDF generation.
    -   **Props**:
        -   `data`: `object` - Contains `items` and `details` for the receipt.
        -   `companyInfo`: `object` - Contains business details.
    -   **Exposed Ref Methods**:
        -   `print()`: Generates the PDF and opens it in a new window.

#### Helper Functions

-   **`generateStandardReceipt(doc, data, companyInfo)`**
    -   **Description**: The core drawing function. It takes a `jsPDF` document instance and populates it with the receipt content, including headers, items, and totals, by manually positioning each element.
    -   **Parameters**:
        -   `doc`: `jsPDF` - The jsPDF document instance.
        -   `data`: `object` - The receipt data.
        -   `companyInfo`: `object` - The business information.

-   **`drawDashedLine(doc, x1, y, x2)`**
    -   **Description**: A utility to draw a horizontal dashed line on the PDF document.
    -   **Parameters**:
        -   `doc`: `jsPDF` - The jsPDF document instance.
        -   `x1`, `y`, `x2`: `number` - The line coordinates.

-   **`wrapText(doc, text, x, y, maxWidth, align)`**
    -   **Description**: A utility to handle text wrapping within a specified width. It calculates line breaks and draws the multi-line text on the PDF.
    -   **Parameters**:
        -   `doc`: `jsPDF` - The jsPDF document instance.
        -   `text`: `string` - The text to wrap.
        -   `x`, `y`, `maxWidth`: `number` - Drawing coordinates and constraints.
        -   `align`: `string` - Text alignment (`'left'`, `'center'`, `'right'`).
    -   **Returns**: `number` - The new Y-coordinate below the drawn text block.