# Ampla Project Documentation

## 1. Project Overview

This project is a web application built with React, appearing to be an inventory management or Point of Sale (POS) system, potentially named "Ampla" or "myStock". The application is designed to manage stock, customers, and sales, with a key feature being the generation of detailed sales receipts.

It uses Redux Toolkit for robust state management, handling data for authentication, stock inventory, and customers. The frontend is built with a mix of UI libraries including TailwindCSS for styling and potentially Material-UI (`@mui/material`) and React-Bootstrap for components. A core functionality is the dynamic generation of receipts, which can be previewed in-browser, printed, or downloaded as PDFs.

## 2. Technology Stack

-   **Frontend Framework**: React
-   **State Management**: Redux Toolkit (`@reduxjs/toolkit`)
-   **Routing**: React Router (`react-router-dom`)
-   **Styling**: TailwindCSS, with potential use of Material-UI (`@mui/material`) and React-Bootstrap.
-   **PDF Generation**: jsPDF, jspdf-autotable
-   **Build Tool**: Create React App

## 3. Inferred Project Structure

Based on the provided file paths and imports, the project seems to follow a feature-based structure inside `src/app/`:

```
src/
└── app/
    ├── auth/
    │   └── authSlice.js        # Redux slice for user authentication state.
    ├── features/
    │   ├── api/
    │   │   └── customers.js    # Redux slice/API endpoint for customer data.
    │   └── stock/
    │       └── stockSlice.js   # Redux slice for managing stock/product data.
    └── Components/
        ├── receipts/
        │   ├── AmplaReceipt.js # Main component for receipt preview, printing, and PDF download.
        │   └── Receipt.jsx     # Alternative template for programmatic PDF generation.
        └── pages/
            └── publicPages/
                └── Privancy.jsx  # Example of a static content page (Privacy Policy).
```

## 4. Core Modules & Function Reference

### 4.1. State Management (Redux)

The application relies on Redux for managing global state.

-   **`auth/authSlice.js`**
    -   **Purpose**: Manages user authentication state, such as user profile information and login status.
    -   **Key Selector**: `selectProfile` - Retrieves the current user's profile from the state.

-   **`features/stock/stockSlice.js`**
    -   **Purpose**: Manages the state of the stock or product inventory.
    -   **Key Selector**: `selectStock` - Retrieves the list of all stock items.

-   **`features/api/customers.js`**
    -   **Purpose**: Manages customer data, likely by fetching it from an API.
    -   **Key Selector**: `selectCustomers` - Retrieves the list of all customers.

### 4.2. Receipt Generation (`Components/receipts/`)

This module is responsible for creating and displaying sales receipts. It has two distinct implementations.

#### File: `d:\Ampla\ampla\ampla\src\app\Components\receipts\AmplaReceipt.js`

This file provides a complete, user-facing receipt generation system with an interactive preview.

-   **Component: `AmplaReceipt({companyInfo, customerName, cart, saleDetails})`**
    -   **Description**: The primary component that orchestrates receipt generation. It loads required scripts, manages the preview modal state, and handles print/download actions. It uses Redux selectors to get product and customer names from their IDs.
    -   **State**:
        -   `scriptsLoaded`: `boolean` - Tracks if the external `jsPDF` scripts have loaded.
        -   `showPreview`: `boolean` - Toggles the visibility of the receipt preview modal.
        -   `receiptSize`: `string` - Stores the selected paper size ('80mm' or '58mm').
    -   **Functions**:
        -   `useEffect()`: Dynamically loads `jspdf` and `jspdf-autotable` from a CDN.
        -   `handlePrint()`: Opens a new window with the receipt's HTML and CSS for printing, formatted to the selected `receiptSize`.
        -   `generateAndDownloadPdf()`: Uses `jsPDF` and `jspdf-autotable` to create a PDF from the sale data and initiates a download.

-   **Component: `ReceiptPreviewModal({ show, onClose, ... })`**
    -   **Description**: A modal component that displays a live, styled HTML preview of the receipt. It allows the user to change the preview size, close the modal, and trigger print/download actions via callbacks.

-   **Helper: `formatCurrency(amount, currency)`**
    -   **Description**: Formats a number into a currency string (e.g., `1200` -> `$1,200.00`).

#### File: `d:\Ampla\ampla\ampla\src\app\Components\receipts\Receipt.jsx`

This file contains a more direct, programmatic approach to generating a PDF receipt. It seems to be a self-contained template.

-   **Component: `ReceiptTemplate({ data, companyInfo })`**
    -   **Description**: A non-rendering component that exposes a `print()` method via a `ref`. It's designed to be controlled by a parent component to trigger PDF generation.
    -   **Exposed Method**: `print()` - Initializes a `jsPDF` document, calls the drawing function, and opens the PDF in a new window.

-   **Function: `generateStandardReceipt(doc, data, companyInfo)`**
    -   **Description**: The main drawing function. It takes a `jsPDF` instance and manually adds text, lines, and wrapped text to construct the receipt layout.

-   **Helpers**:
    -   `drawDashedLine(doc, x1, y, x2)`: Draws a dashed line on the PDF canvas.
    -   `wrapText(doc, text, x, y, maxWidth, align)`: Splits text into multiple lines to fit a specified width and draws it on the canvas.

### 4.3. UI and Pages

-   **File: `d:\Ampla\ampla\ampla\src\app\Components\pages\publicPages\Privancy.jsx`**
    -   **Component: `Privancy`**
    -   **Description**: A simple functional component that renders the static text content for a Privacy Policy page. It uses the `useLocation` hook, suggesting it's part of the app's routing system.

## 5. Build and Development (from README.md)

The project uses the standard scripts provided by Create React App.

-   **`npm start`**: Runs the app in development mode at `http://localhost:3000`.
-   **`npm test`**: Runs the test suite in interactive watch mode.
-   **`npm run build`**: Builds the app for production into the `build` folder.
-   **`npm run eject`**: Ejects from the Create React App configuration for advanced customization.