import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./SavedQuotes.css";

/* ----- helpers (flat £ discount, services + materials) ----- */
const sumLines = (arr = []) =>
  arr.reduce(
    (s, x) => s + (Number(x.price) || 0) * (Number(x.quantity) || 0),
    0,
  );

const computeTotals = (q) => {
  const servicesTotal = sumLines(q.services || []);
  const materialsTotal = sumLines(q.materials || []);
  const subtotal = servicesTotal + materialsTotal;
  const discountFlat = Number(q.discount) || 0;
  const total = Math.max(0, subtotal - discountFlat);
  const deposit25 = +(total * 0.25).toFixed(2);
  return {
    servicesTotal,
    materialsTotal,
    subtotal,
    discountFlat,
    total,
    deposit25,
  };
};

const SavedQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchQuoteNumber, setSearchQuoteNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // filter by createdAt

  const pdfContentRef = useRef(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/quotes");
      setQuotes(response.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const filteredQuotes = useMemo(() => {
    return (quotes || []).filter((q) => {
      const matchesCategory =
        searchCategory === "All Categories" || searchCategory === ""
          ? true
          : (q.category || "").toLowerCase() === searchCategory.toLowerCase();

      const matchesNumber = searchQuoteNumber
        ? (q.quoteNumber || "")
            .toString()
            .toLowerCase()
            .includes(searchQuoteNumber.toLowerCase())
        : true;

      const matchesName = searchName
        ? (q.clientName || "").toLowerCase().includes(searchName.toLowerCase())
        : true;

      const matchesDate = selectedDate
        ? new Date(q.createdAt).toLocaleDateString() ===
          new Date(selectedDate).toLocaleDateString()
        : true;

      return matchesCategory && matchesNumber && matchesName && matchesDate;
    });
  }, [quotes, searchCategory, searchQuoteNumber, searchName, selectedDate]);

  /* ----- print/preview html (same skeleton, adapted for quotes) ----- */
  const getQuoteHtml = (quote) => {
    const {
      servicesTotal,
      materialsTotal,
      subtotal,
      discountFlat,
      total,
      deposit25,
    } = computeTotals(quote);

    const servicesRows = (quote.services || [])
      .map(
        (s, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><div style="white-space: pre-wrap;">${s.name || ""}</div></td>
            <td>£${(Number(s.price) || 0).toFixed(2)}</td>
            <td>${s.quantity || 0}</td>
            <td>£${((Number(s.price) || 0) * (Number(s.quantity) || 0)).toFixed(
              2,
            )}</td>
          </tr>
        `,
      )
      .join("");

    const materialsRows = (quote.materials || [])
      .map(
        (m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><div style="white-space: pre-wrap;">${m.name || ""}</div></td>
            <td>£${(Number(m.price) || 0).toFixed(2)}</td>
            <td>${m.quantity || 0}</td>
            <td>£${((Number(m.price) || 0) * (Number(m.quantity) || 0)).toFixed(
              2,
            )}</td>
          </tr>
        `,
      )
      .join("");

    const discountRow =
      discountFlat > 0
        ? `<tr><td class="label">Discount (flat)</td><td class="value">−£${discountFlat.toFixed(
            2,
          )}</td></tr>`
        : "";

    return `
<html>
<head>
  <title>Quotation</title>
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:0; }
    .invoice-container { width:100%; max-width:800px; margin:auto; padding:20px; border:1px solid #ddd; box-sizing:border-box; }
    .header { color:black; text-align:center; }
    .header h1 { margin:0; color:black; font-size:28px; }
    .header p { margin:5px 0; font-size:14px; }

    .client-info, .invoice-details { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border:3px solid #ddd; padding:10px; }
    .client-info p { margin:5px 0; }

    .table { width:100%; border-collapse:collapse; margin-top:10px; }
    .table th, .table td { border:2px solid black; padding:10px; text-align:left; }
    .table th { background-color:#f4f4f4; }

    .footer { color:black; text-align:center; }
    .footer p:last-child { font-size:12px; color:#666; }

    .totals-wrapper { display:flex; justify-content:space-between; align-items:flex-start; margin-top:20px; }
    .totals-table { width:50%; border-collapse:collapse; font-size:16px; margin-left:auto; }
    .totals-table td { padding:10px; border:1px solid white; text-align:left; }
    .totals-table .label { background-color:#f9f9f9; text-align:left; font-weight:bold; }
    .totals-table .value { text-align:left; font-weight:bold; color:#333; }
    .totals-table .total-row { font-weight:bold; }

    .deposit-box {
      margin-top: 16px;
      padding: 12px;
      border: 2px dashed #333;
      font-size: 14px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { color:black !important; }
      .table th { background-color: white !important; }
      .client-info, .invoice-details { border:3px solid #ddd !important; }
      .footer { color:black !important; }
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
            /* Left-side logos layout */
.left-logos {
  display: flex;
  flex-direction: row;      /* side by side */
  justify-content: flex-start;
  align-items: center;
  gap: 25px;               /* space between logos */
    width: 40%;               /* covers left side */
}

/* Each logo box */
.logo-container {
  flex: 1;      
             /* equal width for both logos */
  text-align: left;
}

  .logo-container img {
  width: 120%;
  height: 100px;
  
}
  .logo-container-1 img {
  width: 120%;
  height: 100px;
  
}
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <h1>Eco Voltex Ltd</h1>
      <p>Powering the Future with Sustainable Solutions</p>
      <p><a href="https://www.ecovoltex.co.uk/" target="_blank">www.ecovoltex.co.uk</a></p>
      <p><strong>Phone:</strong> +44 7930 558824</p>
    </div>
    <!-- Payment Instructions with Logo -->
          <p><strong>Payment Instructions</strong></p>
          <div class="payment-section">
            <div class="payment-details">
              <p><strong>Account Name:</strong> Eco Voltex</p>
              <p><strong>Account Number:</strong> 00347566</p>
              <p><strong>Sort Code:</strong> 20-19-97</p>
            </div>
            <img src="${require("../../assets/logo.jpg")}" alt="Eco Voltex Logo" class="logo" />
          </div>

    <!-- Client Info -->
    <p><strong>Issue to</strong></p>
    <div class="client-info">
      <div>
        <p><strong>Name:</strong> ${quote.clientName || ""}</p>
        <p><strong>Address:</strong> ${
          quote.clientAddress || "Address not provided"
        }</p>
        <p>${quote.postCode || ""}</p>
        ${
          quote.clientPhone
            ? `<p><strong>Phone No/Email:</strong> ${quote.clientPhone}</p>`
            : ""
        }
      </div>
      <div style="text-align:right; flex:1;">
        <p><strong>Quote Number:</strong> ${quote.quoteNumber || ""}</p>
        <p><strong>Issued Date:</strong> ${new Date(
          quote.createdAt,
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}</p>
        <p><strong>Valid Until:</strong> ${
          quote.validUntil
            ? new Date(quote.validUntil).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-"
        }</p>
      </div>
    </div>

    <!-- Services -->
    <p><strong>Services</strong></p>
    <div class="invoice-details">
      <table class="table">
        <thead>
          <tr>
            <th>No.</th><th>Description</th><th>Unit Price</th><th>Qty</th><th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${servicesRows || `<tr><td colspan="5">No services</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Materials (only if exist) -->
    ${
      (quote.materials || []).length
        ? `
      <p><strong>Materials</strong></p>
      <div class="invoice-details">
        <table class="table">
          <thead>
            <tr>
              <th>No.</th><th>Description</th><th>Unit Price</th><th>Qty</th><th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${materialsRows}
          </tbody>
        </table>
      </div>`
        : ""
    }

    <!-- Totals -->
    <div class="totals-wrapper">
    <div class="left-logos">
  <div class="logo-container-1">
    <img src="${require("../../assets/Certification.jpg")}" alt="UKAS Logo" />
  </div>
</div>
      <table class="totals-table">
  <tbody>
    <tr>
      <td class="label">Services Subtotal</td>
      <td class="value">£${servicesTotal.toFixed(2)}</td>
    </tr>

    ${
      (quote.materials || []).length > 0
        ? `<tr><td class="label">Materials Subtotal</td><td class="value">£${materialsTotal.toFixed(
            2,
          )}</td></tr>`
        : ""
    }

    <tr>
      <td class="label">Subtotal</td>
      <td class="value">£${subtotal.toFixed(2)}</td>
    </tr>

    ${discountRow}

    <tr>
      <td class="label total-row">Total</td>
      <td class="value total-row">£${total.toFixed(2)}</td>
    </tr>

    <tr>
      <td class="label">Deposit to Start (25%)</td>
      <td class="value">£${deposit25.toFixed(2)}</td>
    </tr>
  </tbody>
</table>

    </div>

    <!-- Footer -->
<div class="footer">
  <p>Thank you for your business!</p>
  <p>This is a quotation, not a VAT invoice. Work starts after a 25% deposit using your Quote Number as reference.</p>
</div>

  </div>
</body>
</html>
`;
  };

  const printQuote = (id) => {
    const quote = filteredQuotes.find((q) => q._id === id);
    if (!quote) return;
    const w = window.open("", "", "width=900,height=1000");
    w.document.write(getQuoteHtml(quote));
    w.document.close();
  };

  const downloadQuote = (id) => {
    const quote = filteredQuotes.find((q) => q._id === id);
    if (!quote) return;

    const htmlContent = getQuoteHtml(quote);
    const w = window.open("", "", "width=900,height=1000");
    w.document.write(htmlContent);
    w.document.close();

    w.onload = () => {
      w.print();
      w.onafterprint = () => w.close();
    };
  };
  const convertToInvoice = async (quote) => {
    try {
      const totals = computeTotals(quote);

      // Combine services + materials
      const combinedServices = [
        ...(quote.services || []),
        ...(quote.materials || []),
      ].map((item) => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      if (!combinedServices.length) {
        alert("No services or materials to convert.");
        return;
      }

      const invoicePayload = {
        clientName: quote.clientName,
        clientPhone: quote.clientPhone,
        clientAddress: quote.clientAddress,
        postCode: quote.postCode,
        category: quote.category,
        services: combinedServices,

        // Optional fields
        siteAddress: "",
        sitePostCode: "",

        paymentOption: "",
        paidAmount: "",
        date: new Date().toISOString().split("T")[0],
      };

      const res = await axios.post(
        "http://localhost:4000/api/invoices/create",
        invoicePayload,
      );

      alert(res.data.message || "Invoice created successfully");
    } catch (error) {
      console.error(error);
      alert("Error converting to invoice");
    }
  };

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    paidAmount: "",
    paymentOption: "",
  });

  const openInvoiceDialog = (quote) => {
    setSelectedQuote(quote);
    setInvoiceForm({
      paidAmount: "",
      paymentOption: "",
    });
    setShowInvoiceModal(true);
  };

  const confirmConvertToInvoice = async () => {
    if (!selectedQuote) return;

    const paid = Number(invoiceForm.paidAmount);

    if (!Number.isFinite(paid) || paid < 0) {
      alert("Paid amount must be greater than or equal to 0.");
      return;
    }

    if (!invoiceForm.paymentOption) {
      alert("Please select a payment option.");
      return;
    }

    try {
      const combinedServices = [
        ...(selectedQuote.services || []),
        ...(selectedQuote.materials || []),
      ].map((item) => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      const invoicePayload = {
        clientName: selectedQuote.clientName,
        clientPhone: selectedQuote.clientPhone,
        clientAddress: selectedQuote.clientAddress,
        postCode: selectedQuote.postCode,
        category: selectedQuote.category,
        services: combinedServices,

        siteAddress: "",
        sitePostCode: "",

        paymentOption: invoiceForm.paymentOption,
        paidAmount: paid,
        date: new Date().toISOString().split("T")[0],
      };

      const res = await axios.post(
        "http://localhost:4000/api/invoices/create",
        invoicePayload,
      );

      alert(res.data.message || "Invoice created successfully");

      setShowInvoiceModal(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error(error);
      alert("Error converting to invoice");
    }
  };

  const deleteQuote = async (quoteNumber) => {
    if (!window.confirm(`Delete quotation ${quoteNumber}?`)) return;
    try {
      await axios.delete(`http://localhost:4000/api/quotes/${quoteNumber}`);
      await fetchQuotes();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="container">
      <h2>Saved Quotations</h2>

      {/* Filters — same layout as invoices */}
      <div className="search-filters">
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Industrial">Industrial</option>
        </select>

        <input
          type="text"
          placeholder="Search by Quote Number"
          value={searchQuoteNumber}
          onChange={(e) => setSearchQuoteNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search by Client Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        {/* Created/Issue Date */}
        <input
          type="date"
          title="Filter by Created Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Clear filters button */}
      <div style={{ marginTop: "8px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setSearchCategory("All Categories");
            setSearchQuoteNumber("");
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

      {filteredQuotes.length === 0 ? (
        <p className="no-quotes">No quotations found.</p>
      ) : (
        <div className="quotes-grid">
          {filteredQuotes.map((q) => {
            const totals = computeTotals(q);
            const showDiscount = totals.discountFlat > 0;

            return (
              <div className="quote-card" key={q._id} id={`quote-${q._id}`}>
                <h3>Quote Number: {q.quoteNumber}</h3>
                <h3>
                  Created Date: {new Date(q.createdAt).toLocaleDateString()}
                </h3>
                <h3>
                  Valid Until:{" "}
                  {q.validUntil
                    ? new Date(q.validUntil).toLocaleDateString()
                    : "-"}
                </h3>
                <h3>Client Name: {q.clientName}</h3>
                {q.clientPhone && <h3>Phone No/Email: {q.clientPhone}</h3>}
                <h3>Category: {q.category}</h3>

                <h4>Services:</h4>
                <ul>
                  {(q.services || []).map((s, i) => (
                    <li key={s._id || i}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{s.name}</div>
                      {" – £"}
                      {(Number(s.price) || 0).toFixed(2)}
                      {" (Qty: "}
                      {s.quantity}
                      {")"}
                    </li>
                  ))}
                </ul>

                {(q.materials || []).length > 0 && (
                  <>
                    <h4>Materials:</h4>
                    <ul>
                      {(q.materials || []).map((m, i) => (
                        <li key={m._id || i}>
                          <div style={{ whiteSpace: "pre-wrap" }}>{m.name}</div>
                          {" – £"}
                          {(Number(m.price) || 0).toFixed(2)}
                          {" (Qty: "}
                          {m.quantity}
                          {")"}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <h3>Services Subtotal: £{totals.servicesTotal.toFixed(2)}</h3>
                {(q.materials || []).length > 0 && (
                  <h3>
                    Materials Subtotal: £{totals.materialsTotal.toFixed(2)}
                  </h3>
                )}

                <h3>Subtotal: £{totals.subtotal.toFixed(2)}</h3>
                {showDiscount && (
                  <h3>Discount (flat): −£{totals.discountFlat.toFixed(2)}</h3>
                )}
                <h3>Total Quote: £{totals.total.toFixed(2)}</h3>
                <div className="print-button-container">
                  <button onClick={() => downloadQuote(q._id)}>Download</button>
                  <button onClick={() => printQuote(q._id)}>
                    Show details
                  </button>
                  <button onClick={() => deleteQuote(q.quoteNumber)}>
                    Delete
                  </button>
                  <button onClick={() => openInvoiceDialog(q)}>
                    Convert to Invoice
                  </button>
                  {showInvoiceModal && (
                    <div className="modal-overlay">
                      <div className="modal-box">
                        <h3>Convert to Invoice</h3>

                        <div>
                          <label>Paid Amount (£)</label>
                          <input
                            type="number"
                            min="0"
                            value={invoiceForm.paidAmount}
                            onChange={(e) =>
                              setInvoiceForm({
                                ...invoiceForm,
                                paidAmount: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Payment Option</label>
                          <select
                            value={invoiceForm.paymentOption}
                            onChange={(e) =>
                              setInvoiceForm({
                                ...invoiceForm,
                                paymentOption: e.target.value,
                              })
                            }
                          >
                            <option value="">Select category</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                          </select>
                        </div>

                        <div style={{ marginTop: "15px" }}>
                          <button onClick={confirmConvertToInvoice}>
                            Create Invoice
                          </button>
                          <button
                            style={{ marginLeft: "10px" }}
                            onClick={() => setShowInvoiceModal(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={pdfContentRef}
        style={{ position: "absolute", left: "-9999px" }}
      ></div>
    </div>
  );
};

export default SavedQuotes;
