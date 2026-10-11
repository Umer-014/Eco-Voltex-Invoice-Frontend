import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../../lib/lib";
import logo from "../../assets/logo.jpg";
import certificateLogo from "../../assets/Certification.jpg";
import "./SavedQuotes.css";

// Shared smart keywords matching your invoice filters
const workTypeKeywords = {
  electrical: [
    "electrical",
    "electric",
    "led",
    "lighting",
    "light",
    "strip",
    "wiring",
    "wire",
    "power",
    "supply",
    "socket",
    "switch",
    "circuit",
    "fuse",
    "cable",
    "trunking",
    "testing",
    "bulb",
    "lamp",
    "volt",
    "amperage",
    "distribution",
    "board",
    "pendant",
    "downlight",
    "spotlight",
    "dimmer",
    "junction",
    "conduit",
    "earthing",
    "isolation",
  ],
  cctv: [
    "cctv",
    "camera",
    "surveillance",
    "security",
    "recorder",
    "nvr",
    "dvr",
    "lens",
    "monitor",
    "footage",
    "ip camera",
    "dome",
    "bullet",
    "coaxial",
    "ethernet",
    "bnc",
    "hdmi",
    "display",
    "ptz",
    "night vision",
  ],
  "fire alarm": [
    "fire",
    "alarm",
    "smoke",
    "detector",
    "sensor",
    "call point",
    "siren",
    "panel",
    "heat detector",
    "emergency lighting",
    "bell",
    "flashing",
    "strobe",
    "sounder",
    "interlock",
    "zone",
    "loop",
  ],
  epc: ["epc", "energy performance certificate", "energy rating"],
  eicr: ["eicr", "electrical installation condition report", "inspection"],
  eic: ["eic", "electrical inspection certificate", "inspection"],
  pat: ["pat", "portable appliance testing", "appliance test"],
  gas: ["gas", "boiler", "heating", "pipework", "flue", "combustion"],
};

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
  const [loading, setLoading] = useState(true);

  const [searchWorkType, setSearchWorkType] = useState("All Work Types");
  const [searchQuoteNumber, setSearchQuoteNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Default to the current month (e.g., "2026-08")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    paidAmount: "",
    paymentOption: "",
  });

  const pdfContentRef = useRef(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/quotes");
      setQuotes(response.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    return (quotes || []).filter((q) => {
      // Smart Work Type Matching across services and materials
      let matchesWorkType = true;
      if (searchWorkType !== "All Work Types" && searchWorkType !== "") {
        const targetKeywords = workTypeKeywords[
          searchWorkType.toLowerCase()
        ] || [searchWorkType.toLowerCase()];

        const allItems = [...(q.services || []), ...(q.materials || [])];
        matchesWorkType = allItems.some((item) => {
          const itemText = (item.name || "").toLowerCase();
          return targetKeywords.some((keyword) => itemText.includes(keyword));
        });
      }

      const matchesNumber = searchQuoteNumber
        ? (q.quoteNumber || "")
            .toString()
            .toLowerCase()
            .includes(searchQuoteNumber.toLowerCase())
        : true;

      const matchesName = searchName
        ? (q.clientName || "").toLowerCase().includes(searchName.toLowerCase())
        : true;

      const matchesMonth = selectedMonth
        ? new Date(q.createdAt).toISOString().slice(0, 7) === selectedMonth
        : true;

      const matchesDate = selectedDate
        ? new Date(q.createdAt).toLocaleDateString() ===
          new Date(selectedDate).toLocaleDateString()
        : true;

      return (
        matchesWorkType &&
        matchesNumber &&
        matchesName &&
        matchesDate &&
        matchesMonth
      );
    });
  }, [
    quotes,
    searchWorkType,
    searchQuoteNumber,
    searchName,
    selectedDate,
    selectedMonth,
  ]);

  /* ----- print/preview html (same skeleton, adapted for quotes) ----- */
  const getQuoteHtml = (quote) => {
    const services = Array.isArray(quote.services) ? quote.services : [];
    const materials = Array.isArray(quote.materials) ? quote.materials : [];
    const {
      servicesTotal,
      materialsTotal,
      subtotal,
      discountFlat,
      total,
      deposit25,
    } = computeTotals(quote);

    const servicesRows = services
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

    const materialsRows = materials
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

    const notesList = String(quote.notes || "")
      .split(/\r?\n|•|·|\u2022|;|\|/)
      .map((part) => part.replace(/^[\s\-*]+/, "").trim())
      .filter(Boolean);

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
    :root { --header-h: 176px; --footer-h: 62px; }
    html, body { height: 100%; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
    .quote-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; }
    .print-header { position: fixed; top: 0; left: 0; right: 0; z-index: 20; background: #f9f9f9; height: var(--header-h); box-sizing: border-box; overflow: hidden; }
    .print-header .fixed-inner { max-width: 800px; margin: 0 auto; padding: 14px 20px 10px; box-sizing: border-box; }
    .header-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 20px; }
    .header-copy { grid-column: 2; text-align: center; display: flex; flex-direction: column; justify-content: center; }
    .header-copy h1 { margin: 0; font-size: 28px; text-align: center; }
    .header-copy p { margin: 5px 0; font-size: 14px; text-align: center; }
    .header-copy a { color: #000; text-decoration: none; }
    .header-logo { grid-column: 3; display: flex; justify-content: flex-end; align-items: flex-end; height: 100%; }
    .logo { max-width: 180px; max-height: 100px; display: block; transform: translateY(2px); }
    .page-layout { width: 100%; border-collapse: collapse; }
    .page-layout > thead > tr > td, .page-layout > tbody > tr > td, .page-layout > tfoot > tr > td { padding: 0; border: none; }
    .page-layout > thead { display: table-header-group; }
    .page-layout > tfoot { display: table-footer-group; }
    .header-space { height: calc(var(--header-h) + 6px); }
    .footer-space { height: calc(var(--footer-h) + 8px); }
    .client-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border: 2px solid #000; padding: 10px; width: 100%; box-sizing: border-box; gap: 10px; }
    .client-info p { margin: 5px 0; line-height: 1.4; }
    .client-details { flex: 0 0 60%; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .quote-meta { flex: 0 0 40%; min-width: 0; text-align: right; overflow-wrap: anywhere; word-break: break-word; }
    .payment-section { margin-bottom: 12px; border: 2px solid #000; padding: 10px 12px 8px; box-sizing: border-box; width: 100%; }
    .payment-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; font-size: 14px; line-height: 1.5; }
    .payment-details p { margin: 0; overflow-wrap: anywhere; word-break: break-word; }
    .quote-details { display: block; margin-bottom: 10px; padding: 0; width: 100%; box-sizing: border-box; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; box-sizing: border-box; }
    .table th, .table td { border: 2px solid #000; padding: 10px; text-align: left; }
    .table th { background-color: #f4f4f4; }
    .totals-wrapper { position: relative; min-height: 210px; margin-top: 10px; padding: 0 10px; }
    .totals-table { position: absolute; top: 0; right: 10px; width: 42%; border-collapse: collapse; table-layout: fixed; font-size: 15px; margin: 0; }
    .totals-table td { padding: 6px; border: 1px solid #fff; text-align: left; }
    .totals-table .label { width: 58%; background-color: #f9f9f9; font-weight: bold; }
    .totals-table .value { width: 42%; text-align: right; font-weight: bold; color: #000; }
    .totals-table .total-row { font-weight: bold; }
    .left-logos { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 25px; width: auto; }
    .logo-container-1 img { width: 220px; height: 100px; object-fit: contain; }
    .notes-box { margin-top: 18px; border: 2px solid #000; padding: 10px 12px; box-sizing: border-box; width: 100%; }
    .notes-box h3 { margin: 0 0 8px; font-size: 16px; }
    .notes-box ul { margin: 0; padding-left: 18px; }
    .notes-box li { display: block; margin: 4px 0; line-height: 1.4; white-space: normal; }
    .quote-message { margin-top: 16px; padding: 12px; border: 2px dashed #333; font-size: 14px; line-height: 1.45; }
    .print-footer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; background: #fff; border-top: 1px solid #ddd; height: var(--footer-h); box-sizing: border-box; overflow: hidden; }
    .print-footer .fixed-inner { max-width: 800px; height: 100%; margin: 0 auto; padding: 0 20px; box-sizing: border-box; text-align: center; display: flex; align-items: center; justify-content: center; }
    .thank-you { font-weight: bold; margin: 0; }
    .table tr, .client-info, .totals-wrapper, .payment-section, .notes-box { break-inside: avoid; page-break-inside: avoid; }
    @page { size: A4; margin: 0 0 12mm 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .table th { background-color: white !important; }
      .print-header, .print-footer { position: fixed; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="fixed-inner">
      <div class="header-row">
        <div class="header-copy">
          <h1>Eco Voltex Ltd</h1>
          <p>Powering the Future with Sustainable Solutions</p>
          <p style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin: 5px 0;">
            <span><strong>🌐</strong> www.ecovoltex.co.uk</span>
            <span style="display:inline-block;">|</span>
            <span><strong>✉</strong> info@ecovoltex.co.uk</span>
            <span style="display:inline-block;">|</span>
            <span><strong>☏</strong> +44 7930 558824</span>
          </p>
          <p>5-7 Vine Street, Uxbridge London, UB81QE, United Kingdom</p>
        </div>
        <div class="header-logo">
          <img src="${logo}" alt="Eco Voltex Logo" class="logo" />
        </div>
      </div>
    </div>
  </div>

  <div class="quote-container">
    <table class="page-layout">
      <thead><tr><td><div class="header-space"></div></td></tr></thead>
      <tfoot><tr><td><div class="footer-space"></div></td></tr></tfoot>
      <tbody><tr><td>
        <p><strong>Issue to</strong></p>
        <div class="client-info">
          <div class="client-details">
            <p><strong>Name:</strong> ${quote.clientName || ""}</p>
            ${
              quote.clientPhone
                ? `<p>${
                    quote.clientPhone.includes("@")
                      ? `<strong>Email:</strong> ${quote.clientPhone}`
                      : `<strong>Phone:</strong> ${quote.clientPhone}`
                  }</p>`
                : ""
            }
            <p><strong>Address:</strong> ${
              quote.clientAddress || "Address not provided"
            } ${quote.postCode || ""}</p>
            ${
              quote.siteAddress || quote.sitePostCode
                ? `<div style="margin-top: 10px;">
                    <p><strong>Site Address:</strong> ${quote.siteAddress || ""} ${quote.sitePostCode || ""}</p>
                  </div>`
                : ""
            }
          </div>
          <div class="quote-meta">
            
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
            ${quote.category ? `<p><strong>Category:</strong> ${quote.category}</p>` : ""}
          </div>
        </div>

        <p><strong>Payment Details</strong></p>
        <div class="payment-section">
          <div class="payment-details">
            <p><strong>Bank Name:</strong> Barclays Bank</p>
            <p><strong>Account Name:</strong> Eco Voltex Ltd</p>
            <p><strong>Account Number:</strong> 00347566</p>
            <p><strong>Sort Code:</strong> 20-19-97</p>
          </div>
        </div>

        <p><strong>Services</strong></p>
        <div class="quote-details">
          <table class="table">
            <thead>
              <tr>
                <th>No.</th><th>Description</th><th>Unit Price</th><th>Quantity</th><th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${servicesRows || `<tr><td colspan="5">No services</td></tr>`}
              <tr>
                <td colspan="4" style="text-align:right; font-weight:bold;">Service Subtotal</td>
                <td style="font-weight:bold;">£${servicesTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          materials.length
            ? `
          <p><strong>Materials</strong></p>
          <div class="quote-details">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th><th>Description</th><th>Unit Price</th><th>Quantity</th><th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${materialsRows}
                <tr>
                  <td colspan="4" style="text-align:right; font-weight:bold;">Material Subtotal</td>
                  <td style="font-weight:bold;">£${materialsTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>`
            : ""
        }

        <div class="totals-wrapper">
          <div class="left-logos">
            <div class="logo-container-1">
              <img src="${certificateLogo}" alt="Eco Voltex Certificate" />
            </div>
          </div>
          <table class="totals-table">
            <tbody>
              <tr><td class="label">Sub Total</td><td class="value">£${subtotal.toFixed(2)}</td></tr>
              <tr><td class="label">VAT</td><td class="value">£0.00</td></tr>
              ${discountRow}
              <tr><td class="label total-row">Total</td><td class="value total-row">£${total.toFixed(2)}</td></tr>
              <tr><td class="label">Deposit to Start (25%)</td><td class="value">£${deposit25.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="quote-message">
          This is a quotation, not a VAT invoice. Work starts after a 25% deposit using your Quote Number as reference.
        </div>

        ${
          notesList.length
            ? `
          <p><strong>Notes</strong></p>
          <div class="notes-box">
            <ul>
              ${notesList.map((note) => `<li>${note}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }
      </td></tr></tbody>
    </table>
  </div>

  <div class="print-footer">
    <div class="fixed-inner">
      <p class="thank-you">THANK YOU FOR YOUR BUSINESS!</p>
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
    if (!w) {
      alert("Please allow pop-ups to open the quotation.");
      return;
    }
    w.document.write(getQuoteHtml(quote));
    w.document.close();
  };

  const downloadQuote = (id) => {
    const quote = filteredQuotes.find((q) => q._id === id);
    if (!quote) return;
    const w = window.open("", "", "width=900,height=1000");
    if (!w) {
      alert("Please allow pop-ups to open the quotation.");
      return;
    }
    w.document.write(getQuoteHtml(quote));
    w.document.close();
    w.onload = () => {
      w.print();
      w.onafterprint = () => w.close();
    };
  };

  const openInvoiceDialog = (quote) => {
    setSelectedQuote(quote);
    setInvoiceForm({ paidAmount: "", paymentOption: "" });
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

      const res = await api.post("/invoices", invoicePayload);
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
      await api.delete(`/quotes/${quoteNumber}/`);
      await fetchQuotes();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="container">
      <h1>Saved Quotations</h1>

      {/* Expanded filters layout matching SavedInvoices */}
      <div className="search-filters">
        <select
          value={searchWorkType}
          onChange={(e) => setSearchWorkType(e.target.value)}
        >
          <option value="All Work Types">All Work Types</option>
          <option value="Electrical">Electrical</option>
          <option value="CCTV">CCTV</option>
          <option value="Fire Alarm">Fire Alarm</option>
          <option value="EPC">EPC</option>
          <option value="EICR">EICR</option>
          <option value="EIC">EIC</option>
          <option value="PAT">PAT</option>
          <option value="GAS">GAS</option>
        </select>

        <input
          type="text"
          placeholder="Quote Number"
          value={searchQuoteNumber}
          onChange={(e) => setSearchQuoteNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Client Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setSearchWorkType("All Work Types");
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

      {loading ? (
        <div className="quotes-grid">
          {[1, 2, 3, 4].map((key) => (
            <div className="quote-card" key={key}>
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-line-short"></div>
              <div className="skeleton-text skeleton-line-short"></div>
              <div className="skeleton-text skeleton-line-medium"></div>
              <div className="skeleton-text skeleton-line-short"></div>

              <div style={{ marginTop: "16px" }}>
                <div className="skeleton-text skeleton-line-medium"></div>
                <div className="skeleton-text skeleton-line-short"></div>
              </div>

              <div
                className="print-button-container"
                style={{ marginTop: "20px" }}
              >
                <div className="skeleton-text skeleton-btn"></div>
                <div className="skeleton-text skeleton-btn"></div>
                <div className="skeleton-text skeleton-btn"></div>
                <div className="skeleton-text skeleton-btn"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredQuotes.length === 0 ? (
        <p
          className="no-quotes"
          style={{ textAlign: "center", color: "white", marginTop: "30px" }}
        >
          No quotations found. Please try adjusting your Filter criteria.
        </p>
      ) : (
        <>
          <div className="total-quotes">
            Showing {filteredQuotes.length} quotation(s)
          </div>
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
                        <div style={{ whiteSpace: "pre-wrap" }}>{s.name}</div>–
                        £{(Number(s.price) || 0).toFixed(2)} (Qty: {s.quantity})
                      </li>
                    ))}
                  </ul>

                  {(q.materials || []).length > 0 && (
                    <>
                      <h4>Materials:</h4>
                      <ul>
                        {(q.materials || []).map((m, i) => (
                          <li key={m._id || i}>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {m.name}
                            </div>
                            – £{(Number(m.price) || 0).toFixed(2)} (Qty:{" "}
                            {m.quantity})
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
                    <button onClick={() => downloadQuote(q._id)}>
                      Download
                    </button>
                    <button onClick={() => printQuote(q._id)}>
                      Show details
                    </button>
                    <button onClick={() => deleteQuote(q.quoteNumber)}>
                      Delete
                    </button>
                    <button onClick={() => openInvoiceDialog(q)}>
                      Convert to Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
                  setInvoiceForm({ ...invoiceForm, paidAmount: e.target.value })
                }
              />
            </div>
            <div style={{ marginTop: "10px" }}>
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
            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={confirmConvertToInvoice}
                style={{
                  padding: "8px 12px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Create Invoice
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                style={{
                  marginLeft: "10px",
                  padding: "8px 12px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
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
