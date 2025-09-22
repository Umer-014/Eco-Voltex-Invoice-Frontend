import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./SavedInvoices.css";

const SavedInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // string from input type="date"

  const pdfContentRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/invoices/");
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesCategory =
        searchCategory === "All Categories" || searchCategory === ""
          ? true
          : invoice.category?.toLowerCase() === searchCategory.toLowerCase();

      const matchesInvoiceNumber = searchInvoiceNumber
        ? invoice.invoiceNumber?.toString().includes(searchInvoiceNumber)
        : true;

      const matchesName = searchName
        ? invoice.clientName?.toLowerCase().includes(searchName.toLowerCase())
        : true;

      const matchesDate = selectedDate
        ? new Date(invoice.createdAt).toLocaleDateString() ===
          new Date(selectedDate).toLocaleDateString()
        : true;

      return (
        matchesCategory && matchesInvoiceNumber && matchesName && matchesDate
      );
    });
  }, [searchCategory, searchInvoiceNumber, searchName, selectedDate, invoices]);

  const calculateTotalBeforeDiscount = (totalPrice, discount) => {
    // Convert to numbers and provide fallback of 0
    const numericTotal = Number(totalPrice) || 0;
    const numericDiscount = Number(discount) || 0;

    // If discount is 0 (or not provided), just return the total
    if (numericDiscount === 0) {
      return numericTotal.toFixed(2);
    }

    // Otherwise, calculate the price before discount
    const newTotal = numericTotal / (1 - numericDiscount / 100);
    return newTotal.toFixed(2);
  };

  const getInvoiceHtml = (invoice, forPdf = false) => {
    return `
      <html>
      <head>
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            box-sizing: border-box;
          }
          .header {
            color: black;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: black;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .payment-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border: 3px solid #ddd;
            padding: 10px;
          }
          .payment-details {
            font-size: 14px;
            line-height: 1.5;
          }
          .payment-details p {
            margin: 5px 0;
          }
          .logo {
            max-width: 150px;
            max-height: 100px;
          }
          .client-info, .invoice-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border: 3px solid #ddd;
            padding: 10px;
          }
          .client-info p {
            margin: 5px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .table th, .table td {
            border: 2px solid black;
            padding: 10px;
            text-align: left;
          }
          .table th {
            background-color: #f4f4f4;
          }
          .footer {
            color: black;
            text-align: center;
          }
          .footer p:last-child {
  font-size: 12px; /* Smaller font size */
  color: #666; /* Optional: Slightly lighter color */
}

            /* Flexbox Container */
  .totals-wrapper {
    display: flex;
    justify-content: flex-end; /* Align content to the right */
    margin-top: 20px;
  }

  /* Table Styles */
  .totals-table {
    width: 50%; /* Adjust width as needed */
    border-collapse: collapse;
    font-size: 16px;
    margin-left: auto; /* Push table to the right */
  }

  .totals-table td {
    padding: 10px;
    border: 1px solid white;
    text-align: left;
  }

  .totals-table .label {
    background-color: #f9f9f9;
    text-align: left;
    font-weight: bold;
  }

  .totals-table .value {
    text-align: left;
    font-weight: bold;
    color: #333;
  }

  .totals-table .total-row {
    font-weight: bold;
  }

  .totals-table .due-row {
    font-weight: bold;
  }
           /* Ensure colors and borders appear in print */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            color: black !important;
          }
          .table th {
            background-color: white !important;
          }
          .payment-section {
            border: 3px solid #ddd !important;
          }
          .footer {
            color: black !important;
          }
        } 
          
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header Section -->
          <div class="header">
  <h1>Eco Voltex Ltd</h1>
  <p>Powering the Future with Sustainable Solutions</p>
  <p><a href="https://www.ecovoltex.co.uk/" target="_blank">www.ecovoltex.uo.uk</a></p>
  <p>5-7 Vine Street, Uxbridgeb London, UB81QE, United Kingdom</p>
  <p><strong>Phone:</strong> +44 7930 558824 | +44 7947 767758</p>
</div>
  
          <!-- Payment Instructions with Logo -->
          <p><strong>Payment Instructions</strong></p>
          <div class="payment-section">
            <div class="payment-details">
              <p><strong>Account Name:</strong> Eco Voltex</p>
              <p><strong>Account Number:</strong> 00347566</p>
              <p><strong>Sort Code:</strong> 20-19-97</p>
            </div>
            <img src="${require("../assets/logo.jpg")}" alt="Eco Voltex Logo" class="logo" />
          </div>
 <!-- Client Info Section -->
<p><strong>Issue to</strong></p>
<div class="client-info" style="display: flex; justify-content: space-between; align-items: flex-start;">
  <div>
    <p><strong>Name:</strong> ${invoice.clientName}</p>
    <p><strong>Address:</strong> ${
      invoice.clientAddress || "Address not provided"
    }</p>
    <p> ${invoice.postCode}</p>
    ${
      invoice.clientPhone
        ? `<p><strong>Phone No:</strong> ${invoice.clientPhone}</p>`
        : ""
    }
    
  </div>
  <div style="text-align: right; flex: 1; align-items: flex-start;">
    <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Issued Date:</strong> ${new Date(
      invoice.createdAt
    ).toLocaleDateString()}</p>
    <p><strong>Payment Mode:</strong> ${invoice.paymentOption}</p>

    <!-- Only show this section if remainingAmount is zero -->
${
  invoice.remainingAmount === 0
    ? `
  <div>
    <p><strong>Paid Date:</strong> ${new Date(
      invoice.paidDate
    ).toLocaleDateString()}</p>
    <p><strong>Reference Number:</strong> ${invoice.referenceNumber}</p>
  </div>
`
    : ""
}

  </div>
</div>




  
<!-- Services Table -->
<p><strong>Services</strong></p>
<div class="invoice-details">
  <table class="table">
    <thead>
      <tr>
        <th>Service No.</th>
        <th>Description</th>
        <th>Unit Price</th>
        <th>Quantity</th>
        <th>Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.services
        .map(
          (service, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
  <div style="white-space: pre-wrap;">${service.name}</div>
</td>

            <td>£${(Number(service.price) || 0).toFixed(2)}</td>
            <td>${service.quantity}</td>
            <td>£${(
              Number(service.quantity) * Number(service.price) || 0
            ).toFixed(2)}</td>
          </tr>
        `
        )
        .join("")}
    </tbody>
  </table>
</div>

  
<!-- Wrapper for Flexbox -->
<div class="totals-wrapper">
  <table class="totals-table">
    <tbody>
      <tr>
        <td class="label">Sub Total</td>
        <td class="value">£${calculateTotalBeforeDiscount(
          invoice.totalPrice,
          invoice.discount
        )}</td>
      </tr>
      <tr>
        <td class="label">VAT</td>
        <td class="value">£0.00</td>
      </tr>
      <tr>
        <td class="label total-row">Total</td>
        <td class="value total-row">£${invoice.totalPrice.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label">Amount Paid</td>
        <td class="value">£${invoice.paidAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label due-row">Amount Due</td>
        <td class="value due-row">£${invoice.remainingAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
</div>

          <!-- Footer Section -->
          <div class="footer">
  <p>THANK YOU FOR YOUR BUSINESS!</p>
  <p>This business is not VAT registered; therefore, VAT is not applicable (0%).</p>
</div>

        </div>
      </body>
      </html>
    `;
  };

  const printInvoice = (invoiceId) => {
    const invoice = filteredInvoices.find(
      (invoice) => invoice._id === invoiceId
    );
    const printWindow = window.open("", "", "height=800,width=600");
    printWindow.document.write(getInvoiceHtml(invoice));
    printWindow.document.close();
  };

  const downloadInvoice = (invoiceId) => {
    const invoice = filteredInvoices.find(
      (invoice) => invoice._id === invoiceId
    );
    if (!invoice) return;

    const htmlContent = getInvoiceHtml(invoice, true);
    const printWindow = window.open("", "", "width=800,height=900");
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  return (
    <div className="container">
      <h2>Saved Invoices</h2>

      <div className="search-filters">
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          <option value="Residential">Residential</option>
          <option value="Industrial">Industrial</option>
          <option value="Domestic">Domestic</option>
        </select>

        <input
          type="text"
          placeholder="Search by Invoice Number"
          value={searchInvoiceNumber}
          onChange={(e) => setSearchInvoiceNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search by Client Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Clear Filters button on next line */}
      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setSearchCategory("All Categories");
            setSearchInvoiceNumber("");
            setSearchName("");
            setSelectedDate("");
          }}
          style={{
            padding: "8px 16px",
            background: "white",
            color: "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>

      {filteredInvoices.length === 0 ? (
        <p className="no-invoices">No invoices found.</p>
      ) : (
        <div className="invoices-grid">
          {filteredInvoices.map((invoice) => (
            <div
              className="invoice-card"
              key={invoice._id}
              id={`invoice-${invoice._id}`}
            >
              <h3>Invoice Number: {invoice.invoiceNumber}</h3>
              <h3>
                Created Date: {new Date(invoice.createdAt).toLocaleDateString()}
              </h3>
              <h3>Client Name: {invoice.clientName}</h3>
              {invoice.clientPhone && (
                <h3>Client Phone No: {invoice.clientPhone}</h3>
              )}
              <h3>Category: {invoice.category}</h3>
              <h3>Payment Mode: {invoice.paymentOption}</h3>
              <h4>Services:</h4>
              <ul>
                {invoice.services.map((service) => (
                  <li key={service._id}>
                    <div style={{ whiteSpace: "pre-wrap" }}>{service.name}</div>
                    – £{(Number(service.price) || 0).toFixed(2)} (Qty:{" "}
                    {service.quantity})
                  </li>
                ))}
              </ul>

              <h3>
                Total Services: £
                {calculateTotalBeforeDiscount(
                  invoice.totalPrice,
                  invoice.discount
                )}
              </h3>
              <h3>Discount: {(Number(invoice.discount) || 0).toFixed(2)}%</h3>
              <h3>
                Total Bill: £{(Number(invoice.totalPrice) || 0).toFixed(2)}
              </h3>
              <h3>
                Paid Amount: £{(Number(invoice.paidAmount) || 0).toFixed(2)}
              </h3>
              <h3>
                Remaining Balance £
                {(Number(invoice.remainingAmount) || 0).toFixed(2)}
              </h3>

              <div className="print-button-container">
                <button onClick={() => downloadInvoice(invoice._id)}>
                  Download
                </button>
                <button onClick={() => printInvoice(invoice._id)}>
                  Show details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        ref={pdfContentRef}
        style={{ position: "absolute", left: "-9999px" }}
      ></div>
    </div>
  );
};

export default SavedInvoices;
