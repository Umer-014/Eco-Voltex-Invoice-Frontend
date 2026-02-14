// src/Components/Admin.js
import { useAuth } from "../context/AuthContext";
import api from "../lib/lib";
import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.jpg";

export default function Admin() {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // filters + modal state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [editInvoice, setEditInvoice] = useState(null); // invoice object being edited
  const [saving, setSaving] = useState(false);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const [paidAmount, setPaidAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paidDate, setPaidDate] = useState("");

  // inside your Admin component state section:
  const [visibleCount, setVisibleCount] = useState(5);

  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [unpaidInvoicesList, setUnpaidInvoicesList] = useState([]);

  // New: Preset financial-year filters + custom range
  // Values: 'all' | 'FY_2024_2025' | 'FY_2025_2026' | 'custom'
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customStart, setCustomStart] = useState(""); // yyyy-mm-dd
  const [customEnd, setCustomEnd] = useState(""); // yyyy-mm-dd

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const r = await api.get("/api/invoices");
        setInvoices(r.data); // assumes array
      } catch (err) {
        console.error("Error fetching invoices", err);
      } finally {
        setLoadingInvoices(false);
      }
    };
    fetchInvoices();

    // set default period according to current date
    const today = new Date();
    const fy2024Start = new Date("2024-10-10");
    const fy2024End = new Date("2025-10-31");
    const fy2025Start = new Date("2025-11-01");
    const fy2025End = new Date("2026-10-31");

    if (today >= fy2024Start && today <= fy2024End) {
      setSelectedPeriod("FY_2024_2025");
    } else if (today >= fy2025Start && today <= fy2025End) {
      setSelectedPeriod("FY_2025_2026");
    } else {
      setSelectedPeriod("all");
    }
  }, []);

  // --- Helpers ---
  const getPeriodRange = () => {
    // Return [startDate, endDate] or [null, null] for 'all'
    switch (selectedPeriod) {
      case "FY_2024_2025":
        return [
          new Date("2024-10-10T00:00:00.000Z"),
          new Date("2025-10-31T23:59:59.999Z"),
        ];
      case "FY_2025_2026":
        return [
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-10-31T23:59:59.999Z"),
        ];
      case "custom":
        if (customStart && customEnd) {
          // Interpret dates as local and include entire end day
          const s = new Date(`${customStart}T00:00:00`);
          const e = new Date(`${customEnd}T23:59:59.999`);
          return [s, e];
        }
        return [null, null];
      default:
        return [null, null];
    }
  };

  const withinRange = (d, start, end) => {
    if (!start || !end) return true; // 'all' or incomplete custom range
    const when = new Date(d);
    return when >= start && when <= end;
  };

  // stats (for current period selection)
  const [periodStart, periodEnd] = getPeriodRange();

  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) =>
      withinRange(inv.createdAt, periodStart, periodEnd),
    );
  }, [invoices, periodStart, periodEnd]);

  const totalInvoices = periodInvoices.length;
  const TotalInvoiceValue = periodInvoices.reduce(
    (sum, inv) => sum + (Number(inv.totalPrice) || 0),
    0,
  );
  const unpaidCount = periodInvoices.filter(
    (inv) => inv.remainingAmount > 0,
  ).length;
  const TotalRevenue = periodInvoices.reduce(
    (sum, inv) => sum + (Number(inv.paidAmount) || 0),
    0,
  );

  // filtering logic (search + single date + unpaid + period)
  const filteredInvoices = periodInvoices.filter((inv) => {
    const nameMatch = inv.clientName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const dateMatch = selectedDate
      ? new Date(inv.createdAt).toLocaleDateString("en-CA") === selectedDate
      : true;
    const unpaidMatch = showOnlyUnpaid ? inv.remainingAmount > 0 : true;
    return nameMatch && dateMatch && unpaidMatch;
  });

  // show only last N if no text/date filters
  const displayedInvoices =
    searchQuery || selectedDate
      ? filteredInvoices
      : filteredInvoices.slice(-visibleCount).reverse();

  // Open edit modal - fetch fresh invoice by invoiceNumber
  const openEdit = async (invoiceNumber) => {
    try {
      const r = await api.get(`/api/invoices/number/${invoiceNumber}`);
      const inv = r.data;
      setEditInvoice({
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName || "",
        clientPhone: inv.clientPhone || "",
        clientAddress: inv.clientAddress || "",
        postCode: inv.postCode || "",
        siteAddress: inv.siteAddress || "",
        sitePostCode: inv.sitePostCode || "",
        paymentOption: inv.paymentOption || "",
        category: inv.category || "",
        issueDate: inv.createdAt || "",
        services: inv.services?.map((s) => ({
          name: s.name || "",
          price: s.price != null ? String(s.price) : "",
          quantity: s.quantity != null ? String(s.quantity) : "1",
        })) || [{ name: "", price: "", quantity: "1" }],
        paidAmount: inv.paidAmount != null ? String(inv.paidAmount) : "0",
      });
    } catch (err) {
      console.error("Failed to load invoice", err);
      alert("Failed to load invoice for editing");
    }
  };

  const setEditField = (field, value) =>
    setEditInvoice((s) => ({ ...s, [field]: value }));

  const setServiceField = (index, key, value) =>
    setEditInvoice((s) => {
      const services = [...(s.services || [])];
      services[index] = { ...services[index], [key]: value };
      return { ...s, services };
    });

  const addService = () =>
    setEditInvoice((s) => ({
      ...s,
      services: [...s.services, { name: "", price: "", quantity: "1" }],
    }));

  const removeService = (idx) =>
    setEditInvoice((s) => {
      const services = s.services.filter((_, i) => i !== idx);
      return { ...s, services };
    });

  function closePaymentForm() {
    setShowPaymentForm(false);
    setPaymentInvoiceId(null);
    setPaidAmount("");
    setReferenceNumber("");
    setPaidDate("");
  }

  function submitPayment() {
    if (isNaN(parseFloat(paidAmount)) || parseFloat(paidAmount) <= 0) {
      alert("Invalid amount entered");
      return;
    }
    if (!paymentInvoiceId) {
      alert("No invoice selected for payment update");
      return;
    }

    const payload = {
      paidAmount: parseFloat(paidAmount),
      referenceNumber: referenceNumber || null,
      paidDate: paidDate || null,
    };

    api
      .put(`/api/invoices/${paymentInvoiceId}`, payload)
      .then((res) => {
        const updated = res.data;
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.invoiceNumber === updated.invoiceNumber ? updated : inv,
          ),
        );
        alert((res.data && res.data.message) || "Payment updated successfully");
      })
      .catch((err) => {
        console.error("Error updating payment:", err);
        alert("Failed to update payment");
      })
      .finally(() => closePaymentForm());
  }

  const saveEdit = async () => {
    if (!editInvoice) return;
    setSaving(true);
    try {
      const payload = {
        clientName: editInvoice.clientName,
        clientPhone: editInvoice.clientPhone,
        clientAddress: editInvoice.clientAddress,
        siteAddress: editInvoice.siteAddress || "",
        sitePostCode: editInvoice.sitePostCode || "",
        postCode: editInvoice.postCode,
        paymentOption: editInvoice.paymentOption,
        category: editInvoice.category,
        services: (editInvoice.services || []).map((s) => ({
          name: s.name,
          price: Number(s.price) || 0,
          quantity: Number(s.quantity) || 0,
        })),
        paidAmount: Number(editInvoice.paidAmount) || 0,
      };

      const r = await api.put(
        `/api/invoices/number/${editInvoice.invoiceNumber}`,
        payload,
      );
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceNumber === r.data.invoiceNumber ? r.data : inv,
        ),
      );
      setEditInvoice(null);
    } catch (err) {
      console.error("Failed to save invoice", err);
      alert("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const deleteInvoice = async (invoiceNumber) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      await api.delete(`/api/invoices/${invoiceNumber}`);
      setInvoices((prev) =>
        prev.filter((i) => i.invoiceNumber !== invoiceNumber),
      );
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete invoice");
    }
  };

  const getInvoiceHtml = (invoice, forPdf = false) => {
    return `
      <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .invoice-container { width: 100%; max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ddd; box-sizing: border-box; }
          .header { color: black; text-align: center; }
          .header h1 { margin: 0; color: black; font-size: 28px; }
          .header p { margin: 5px 0; font-size: 14px; }
          .payment-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border: 3px solid #ddd; padding: 10px; }
          .payment-details { font-size: 14px; line-height: 1.5; }
          .payment-details p { margin: 5px 0; }
          .logo { max-width: 150px; max-height: 100px; }
          .client-info, .invoice-details { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border: 3px solid #ddd; padding: 10px; }
          .client-info p { margin: 5px 0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th, .table td { border: 2px solid black; padding: 10px; text-align: left; }
          .table th { background-color: #f4f4f4; }
          .footer { color: black; text-align: center; }
          .footer p:last-child { font-size: 12px; color: #666; }
          .totals-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
          .totals-table { width: 50%; border-collapse: collapse; font-size: 16px; margin-left: auto; }
          .totals-table td { padding: 10px; border: 1px solid white; text-align: left; }
          .totals-table .label { background-color: #f9f9f9; text-align: left; font-weight: bold; }
          .totals-table .value { text-align: left; font-weight: bold; color: #333; }
          .totals-table .total-row { font-weight: bold; }
          .totals-table .due-row { font-weight: bold; }
          .left-logos { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 25px; width: 40%; }
          .logo-container { flex: 1; text-align: left; }
          .logo-container img { width: 120%; height: 100px; }
          .logo-container-1 img { width: 120%; height: 100px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .header { color: black !important; } .table th { background-color: white !important; } .payment-section { border: 3px solid #ddd !important; } .footer { color: black !important; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>Eco Voltex Ltd</h1>
            <p>Powering the Future with Sustainable Solutions</p>
            <p><a href="https://www.ecovoltex.co.uk/" target="_blank">www.ecovoltex.uo.uk</a></p>
            <p>${
              new Date(invoice.createdAt) < new Date("2025-07-01")
                ? "9a Oak Road Romford RM3 0PH"
                : "5-7 Vine Street, Uxbridge London, UB81QE, United Kingdom"
            }</p>
            <p><strong>Phone:</strong> +44 7930 558824</p>
          </div>
          <p><strong>Payment Instructions</strong></p>
          <div class="payment-section">
            <div class="payment-details">
              <p><strong>Account Name:</strong> Eco Voltex</p>
              <p><strong>Account Number:</strong> 00347566</p>
              <p><strong>Sort Code:</strong> 20-19-97</p>
            </div>
            <img src="${logo}" alt="Eco Voltex Logo" class="logo" />
          </div>
          <p><strong>Issue to</strong></p>
          <div class="client-info" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
  <p><strong>Name:</strong> ${invoice.clientName}</p>
  <p><strong>Address:</strong> ${
    invoice.clientAddress || "Address not provided"
  }</p>
  <p>${invoice.postCode}</p>

  ${
    invoice.siteAddress || invoice.sitePostCode
      ? `
        <div style="margin-top: 10px;">
          ${
            invoice.siteAddress
              ? `<p><strong>Site Address:</strong> ${invoice.siteAddress}</p>`
              : ""
          }
          ${invoice.sitePostCode ? `<p>${invoice.sitePostCode}</p>` : ""}
        </div>
      `
      : ""
  }

  ${
    invoice.clientPhone
      ? `<p><strong>Phone No/Email:</strong> ${invoice.clientPhone}</p>`
      : ""
  }
</div>


            <div style="text-align: right; flex: 1; align-items: flex-start;">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Issued Date:</strong> ${new Date(
                invoice.createdAt,
              ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}</p>
              <p><strong>Payment Mode:</strong> ${invoice.paymentOption}</p>
              ${
                invoice.remainingAmount === 0
                  ? `
              <div>
                <p><strong>Paid Date:</strong> ${
                  invoice.paidDate && !isNaN(new Date(invoice.paidDate))
                    ? new Date(invoice.paidDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : new Date(invoice.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                }</p>
                ${
                  invoice.referenceNumber
                    ? `<p><strong>Reference Number:</strong> ${invoice.referenceNumber}</p>`
                    : ""
                }
              </div>
            `
                  : ""
              }
            </div>
          </div>
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
                    <td><div style="white-space: pre-wrap;">${
                      service.name
                    }</div></td>
                    <td>£${(Number(service.price) || 0).toFixed(2)}</td>
                    <td>${service.quantity}</td>
                    <td>£${(
                      Number(service.quantity) * Number(service.price) || 0
                    ).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="totals-wrapper">
            <div class="left-logos">
              <div class="logo-container-1">
                <img src="${require("../assets/Certification.jpg")}" alt="UKAS Logo" />
              </div>
            </div>
            <table class="totals-table">
              <tbody>
                <tr>
                  <td class="label">Sub Total</td>
                  <td class="value">£${calculateTotalBeforeDiscount(
                    invoice.totalPrice,
                    invoice.discount,
                  )}</td>
                </tr>
                <tr>
                  <td class="label">VAT</td>
                  <td class="value">£0.00</td>
                </tr>
                <tr>
                ${
                  invoice.discount > 0
                    ? `<tr>
        <td class="label">Discount</td>
        <td class="value">£${invoice.discount.toFixed(2)}</td>
      </tr>`
                    : ""
                } 
                  <td class="label total-row">Total</td>
                  <td class="value total-row">£${invoice.totalPrice.toFixed(
                    2,
                  )}</td>
                </tr>
                <tr>
                  <td class="label">Amount Paid</td>
                  <td class="value">£${invoice.paidAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label due-row">Amount Due</td>
                  <td class="value due-row">£${invoice.remainingAmount.toFixed(
                    2,
                  )}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>THANK YOU FOR YOUR BUSINESS!</p>
            <p>This business is not VAT registered; therefore, VAT is not applicable (0%).</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const calculateTotalBeforeDiscount = (totalPrice, discount) => {
    const newTotal = totalPrice + discount;
    return newTotal.toFixed(2);
  };

  const printInvoice = (invoiceId) => {
    const invoice =
      invoices.find(
        (inv) => inv._id === invoiceId || inv.invoiceNumber === invoiceId,
      ) ||
      filteredInvoices.find(
        (inv) => inv._id === invoiceId || inv.invoiceNumber === invoiceId,
      );
    if (!invoice) {
      alert("Invoice not found for printing");
      return;
    }
    const printWindow = window.open("", "", "height=800,width=600");
    printWindow.document.write(getInvoiceHtml(invoice));
    printWindow.document.close();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f9" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "#00D100",
          color: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem", color: "white" }}>
          Admin Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.5rem" }}>
            Welcome, {user?.username || "Admin"}
          </span>
          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              border: "none",
              padding: "8px 16px",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "24px" }}>
        {/* Quick stats for currently selected period */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={cardStyle}>
            <h3>Total Invoices</h3>
            <p style={statStyle}>{totalInvoices}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
              {periodStart && periodEnd
                ? `${periodStart.toLocaleDateString()} → ${periodEnd.toLocaleDateString()}`
                : "All time"}
            </p>
          </div>
          <div style={cardStyle}>
            <h3>Total Invoices Value</h3>
            <p style={statStyle}>£ {TotalInvoiceValue.toLocaleString()}</p>
          </div>
          <div style={cardStyle}>
            <h3>Total Revenue</h3>
            <p style={statStyle}>£ {TotalRevenue.toLocaleString()}</p>
          </div>
          <div
            style={{ ...cardStyle, cursor: "pointer" }}
            onClick={() => {
              const unpaid = periodInvoices.filter(
                (inv) => inv.remainingAmount > 0,
              );
              setUnpaidInvoicesList(unpaid);
              setShowDrawer(true);
            }}
          >
            <h3>Unpaid Invoices</h3>
            <p style={statStyle}>{unpaidCount}</p>
          </div>
        </div>

        {/* New: Period selector row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 600 }}>Period:</span>
          <button
            onClick={() => setSelectedPeriod("all")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "all" ? pillActive : {}),
            }}
          >
            All
          </button>
          <button
            onClick={() => setSelectedPeriod("FY_2024_2025")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "FY_2024_2025" ? pillActive : {}),
              color: "black",
            }}
          >
            10 Oct 2024 → 31 Oct 2025
          </button>
          <button
            onClick={() => setSelectedPeriod("FY_2025_2026")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "FY_2025_2026" ? pillActive : {}),
              color: "black",
            }}
          >
            01 Nov 2025 → 31 Oct 2026
          </button>

          {/* Custom range */}
          <button
            onClick={() => setSelectedPeriod("custom")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "custom" ? pillActive : {}),
              color: "black",
            }}
          >
            Custom
          </button>

          {selectedPeriod === "custom" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={dateInput}
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={dateInput}
              />
              <button
                onClick={() => {
                  // noop: selecting dates auto-applies; this ensures re-render
                  setSelectedPeriod("custom");
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "black",
                }}
              >
                Apply
              </button>
            </div>
          )}

          {/* Toggle unpaid-only */}
          <label
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            <input
              type="checkbox"
              checked={showOnlyUnpaid}
              onChange={(e) => setShowOnlyUnpaid(e.target.checked)}
            />
            Show only unpaid
          </label>
        </div>

        {/* Existing filters: search + single exact date */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "16px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by client name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              flex: "1",
            }}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Invoices Table */}
        <h2>Invoices</h2>
        {loadingInvoices ? (
          <p>Loading invoices…</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              marginTop: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#00D100", color: "#fff" }}>
                <th style={headerCell}>Invoice #</th>
                <th style={headerCell}>Client</th>
                <th style={headerCellRight}>Total</th>
                <th style={headerCellRight}>Paid</th>
                <th style={headerCellRight}>Remaining</th>
                <th style={headerCell}>Created</th>
                <th style={headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((inv, idx) => (
                <tr
                  key={inv._id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#f7f7f7",
                    transition: "background .2s",
                  }}
                >
                  <td style={bodyCell}>{inv.invoiceNumber}</td>
                  <td style={bodyCell}>{inv.clientName}</td>
                  <td style={bodyCellRight}>
                    {Number(inv.totalPrice || 0).toFixed(2)}
                  </td>
                  <td style={bodyCellRight}>
                    {Number(inv.paidAmount || 0).toFixed(2)}
                  </td>
                  <td style={bodyCellRight}>
                    {Number(inv.remainingAmount || 0).toFixed(2)}
                  </td>
                  <td style={bodyCell}>
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>

                  <td style={bodyCell}>
                    <button
                      style={{ ...actionBtn, background: "blue" }}
                      onClick={() => printInvoice(inv.invoiceNumber)}
                    >
                      Show Invoice
                    </button>
                    <button
                      style={{ ...actionBtn, background: "green" }}
                      onClick={() => {
                        setPaymentInvoiceId(inv.invoiceNumber);
                        setRemainingAmount(inv.remainingAmount);
                        setShowPaymentForm(true);
                      }}
                    >
                      Update Payment
                    </button>

                    <button
                      style={actionBtn}
                      onClick={() => openEdit(inv.invoiceNumber)}
                    >
                      Edit
                    </button>

                    <button
                      style={{ ...actionBtn, background: "#ef4444" }}
                      onClick={() => deleteInvoice(inv.invoiceNumber)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Only show the buttons when there are no search/date filters */}
        {!searchQuery && !selectedDate && filteredInvoices.length > 5 && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            {visibleCount < filteredInvoices.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                style={{
                  padding: "8px 12px",
                  background: "#00D100",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "8px",
                }}
              >
                Show More
              </button>
            )}
            {visibleCount > 5 && (
              <button
                onClick={() => setVisibleCount(5)}
                style={{
                  padding: "8px 12px",
                  background: "#ccc",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Show Less
              </button>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editInvoice && (
          <div style={modalOverlay}>
            <div style={modal}>
              <h3>Edit Invoice {editInvoice.invoiceNumber || ""}</h3>

              <div style={{ display: "grid", gap: 8 }}>
                <label>Client Name</label>
                <input
                  value={editInvoice.clientName}
                  onChange={(e) => setEditField("clientName", e.target.value)}
                />

                <label>Client Phone</label>
                <input
                  value={editInvoice.clientPhone}
                  onChange={(e) => setEditField("clientPhone", e.target.value)}
                />

                <label>Client Address</label>
                <input
                  value={editInvoice.clientAddress}
                  onChange={(e) =>
                    setEditField("clientAddress", e.target.value)
                  }
                />

                <label>Post Code</label>
                <input
                  value={editInvoice.postCode}
                  onChange={(e) => setEditField("postCode", e.target.value)}
                />

                <label>Payment Option</label>
                <input
                  value={editInvoice.paymentOption}
                  onChange={(e) =>
                    setEditField("paymentOption", e.target.value)
                  }
                />

                <label>Category</label>
                <input
                  value={editInvoice.category}
                  onChange={(e) => setEditField("category", e.target.value)}
                />

                <label>Paid Amount</label>
                <input
                  type="number"
                  value={editInvoice.paidAmount}
                  onChange={(e) => setEditField("paidAmount", e.target.value)}
                />

                <label>Date</label>
                <p>
                  {new Date(editInvoice.issueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <div>
                  <label style={{ display: "block", marginTop: 8 }}>
                    Services
                  </label>
                  {editInvoice.services.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 6,
                        alignItems: "center",
                      }}
                    >
                      <input
                        placeholder="name"
                        value={s.name}
                        onChange={(e) =>
                          setServiceField(i, "name", e.target.value)
                        }
                      />
                      <input
                        placeholder="price"
                        type="number"
                        value={s.price}
                        onChange={(e) =>
                          setServiceField(i, "price", e.target.value)
                        }
                      />
                      <input
                        placeholder="qty"
                        type="number"
                        value={s.quantity}
                        onChange={(e) =>
                          setServiceField(i, "quantity", e.target.value)
                        }
                      />
                      <button
                        onClick={() => removeService(i)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          padding: "4px 6px",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button onClick={addService} style={{ marginTop: 6 }}>
                    Add Service
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    onClick={() => setEditInvoice(null)}
                    style={{ padding: "8px 12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: "8px 12px",
                      background: "#00D100",
                      color: "#fff",
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPaymentForm && (
          <div style={modalOverlay}>
            <div style={modal}>
              <h3>Update Payment for Invoice {paymentInvoiceId}</h3>
              <label>Amount Paid:</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />

              {parseFloat(paidAmount) >= remainingAmount && (
                <>
                  <label>Reference Number:</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />

                  <label>Paid Date:</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                  />
                </>
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={submitPayment} style={actionBtn}>
                  Submit
                </button>
                <button
                  onClick={closePaymentForm}
                  style={{ ...actionBtn, background: "#ccc" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer overlay */}
        {showDrawer && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 9999,
            }}
            onClick={() => setShowDrawer(false)}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: "320px",
                background: "#fff",
                boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
                padding: "16px",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>Unpaid Invoices</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {unpaidInvoicesList.map((inv) => (
                  <li
                    key={inv._id}
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    <strong>#{inv.invoiceNumber}</strong> — {inv.clientName}
                    <br />
                    <span style={{ fontSize: "12px", color: "#555" }}>
                      Remaining: {Number(inv.remainingAmount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                style={{
                  marginTop: "16px",
                  width: "100%",
                  padding: "8px",
                  background: "#00D100",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowDrawer(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* styles used above */
const cardStyle = {
  flex: "1 1 150px",
  background: "#fff",
  padding: "16px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};
const statStyle = { fontSize: "1.5rem", fontWeight: "bold", margin: 0 };
const headerCell = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: "600",
};
const headerCellRight = {
  ...headerCell,
  textAlign: "right",
};
const bodyCell = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "0.95rem",
};
const bodyCellRight = {
  ...bodyCell,
  textAlign: "right",
};
const actionBtn = {
  background: "#00D100",
  color: "white",
  border: "none",
  padding: "4px 8px",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "6px",
};
const pillBtn = {
  padding: "6px 10px",
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 14,
};
const pillActive = {
  background: "#00D100",
  color: "#fff",
  borderColor: "#00D100",
};
const dateInput = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
};
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "grid",
  placeItems: "center",
  zIndex: 2000,
};
const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: "min(900px, 95%)",
  maxHeight: "90vh",
  overflow: "auto",
};
