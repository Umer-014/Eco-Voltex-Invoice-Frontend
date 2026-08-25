import api from "../lib/lib";
import { useEffect, useMemo, useState } from "react";
import { getInvoiceHtml } from "../utils/invoiceHtml";


// Shared smart keywords matching your work type filter logic
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
};

export default function Admin() {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [globalActionLoading, setGlobalActionLoading] = useState(false);

  // filters + modal state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchWorkType, setSearchWorkType] = useState("All Work Types");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth()),
  );
  const [editInvoice, setEditInvoice] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const [paidAmount, setPaidAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paidDate, setPaidDate] = useState("");

  const [visibleCount, setVisibleCount] = useState(5);
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [unpaidInvoicesList, setUnpaidInvoicesList] = useState([]);

  // Financial-year filters + custom range
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const r = await api.get("/invoices");
      setInvoices(r.data || []);
    } catch (err) {
      console.error("Error fetching invoices", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

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

  const getPeriodRange = () => {
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
    if (!start || !end) return true;
    const when = new Date(d);
    return when >= start && when <= end;
  };

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

  // Filtering logic (search + work type + date + unpaid + period)
  const filteredInvoices = periodInvoices.filter((inv) => {
    const invDate = new Date(inv.createdAt);

    const nameMatch = inv.clientName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const dateMatch = selectedDate
      ? new Date(inv.createdAt).toLocaleDateString("en-CA") === selectedDate
      : true;

    const monthMatch =
      selectedMonth !== "all"
        ? invDate.getMonth() === parseInt(selectedMonth, 10)
        : true;

    const unpaidMatch = showOnlyUnpaid ? inv.remainingAmount > 0 : true;

    // Smart work type filter matching services
    let matchesWorkType = true;
    if (searchWorkType !== "All Work Types" && searchWorkType !== "") {
      const targetKeywords = workTypeKeywords[searchWorkType.toLowerCase()] || [
        searchWorkType.toLowerCase(),
      ];
      matchesWorkType = (inv.services || []).some((item) => {
        const itemText = (item.name || "").toLowerCase();
        return targetKeywords.some((keyword) => itemText.includes(keyword));
      });
    }

    return (
      nameMatch && dateMatch && monthMatch && unpaidMatch && matchesWorkType
    );
  });

  const displayedInvoices =
    searchQuery ||
    selectedDate ||
    selectedMonth !== "all" ||
    searchWorkType !== "All Work Types"
      ? filteredInvoices
      : filteredInvoices.slice(-visibleCount).reverse();

  const openEdit = async (invoiceNumber) => {
    try {
      setGlobalActionLoading(true);
      const r = await api.get(`/invoices/${invoiceNumber}`);
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
    } finally {
      setGlobalActionLoading(false);
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

    setGlobalActionLoading(true);
    api
      .patch(`/invoices/${paymentInvoiceId}/payment`, payload)
      .then(async (res) => {
        alert((res.data && res.data.message) || "Payment updated successfully");
        await fetchInvoices(); // Refresh all data properly
      })
      .catch((err) => {
        console.error("Error updating payment:", err);
        alert("Failed to update payment");
      })
      .finally(() => {
        setGlobalActionLoading(false);
        closePaymentForm();
      });
  }

  const saveEdit = async () => {
    if (!editInvoice) return;
    setSaving(true);
    setGlobalActionLoading(true);
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

      await api.put(`/invoices/${editInvoice.invoiceNumber}`, payload);
      await fetchInvoices(); // Refresh fresh data
      setEditInvoice(null);
    } catch (err) {
      console.error("Failed to save invoice", err);
      alert("Failed to save invoice");
    } finally {
      setSaving(false);
      setGlobalActionLoading(false);
    }
  };

  const deleteInvoice = async (invoiceNumber) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      setGlobalActionLoading(true);
      await api.delete(`/invoices/${invoiceNumber}`);
      await fetchInvoices();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete invoice");
    } finally {
      setGlobalActionLoading(false);
    }
  };


  const printInvoice = (invoiceId) => {
    const invoice = invoices.find(
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
      {/* Global Action Loader Overlay */}
      {globalActionLoading && (
        <div style={globalLoaderOverlay}>
          <div style={loaderCard}>Processing request...</div>
        </div>
      )}

      <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Quick stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Blue: number of invoices */}
          <div
            style={{
              ...cardStyle,
              borderTop: "5px solid #2563eb",
              background: "#eff6ff",
            }}
          >
            <h3>Total Invoices</h3>
            <p style={statStyle}>{totalInvoices}</p>
          </div>

          {/* Purple: total invoice amount */}
          <div
            style={{
              ...cardStyle,
              borderTop: "5px solid #7c3aed",
              background: "#f5f3ff",
            }}
          >
            <h3>Total Invoices Value</h3>
            <p style={statStyle}>£ {TotalInvoiceValue.toLocaleString()}</p>
          </div>

          {/* Green: money received */}
          <div
            style={{
              ...cardStyle,
              borderTop: "5px solid #16a34a",
              background: "#f0fdf4",
            }}
          >
            <h3>Total Revenue</h3>
            <p style={statStyle}>£ {TotalRevenue.toLocaleString()}</p>
          </div>

          {/* Red: invoices that still need payment */}
          <div
            style={{
              ...cardStyle,
              cursor: "pointer",
              borderTop: "5px solid #dc2626",
              background: "#fef2f2",
            }}
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

        {/* Period selector row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
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
            }}
          >
            10 Oct 2024 → 31 Oct 2025
          </button>
          <button
            onClick={() => setSelectedPeriod("FY_2025_2026")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "FY_2025_2026" ? pillActive : {}),
            }}
          >
            01 Nov 2025 → 31 Oct 2026
          </button>
          <button
            onClick={() => setSelectedPeriod("custom")}
            style={{
              ...pillBtn,
              ...(selectedPeriod === "custom" ? pillActive : {}),
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
            </div>
          )}

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

        {/* Filters Grid: Work Type, Search & Date */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <select
            value={searchWorkType}
            onChange={(e) => setSearchWorkType(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            <option value="All Work Types">All Work Types</option>
            <option value="Electrical">Electrical</option>
            <option value="CCTV">CCTV</option>
            <option value="Fire Alarm">Fire Alarm</option>
          </select>

          <input
            type="text"
            placeholder="Search by client name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          {/* Added Month Filter Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            <option value="all">All Months</option>
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
        </div>

        {/* Invoices Table Section */}
        <h2>Invoices</h2>
        {loadingInvoices ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Loading invoices…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                marginTop: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
                minWidth: "800px",
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
                    }}
                  >
                    <td style={bodyCell}>{inv.invoiceNumber}</td>
                    <td style={bodyCell}>{inv.clientName}</td>
                    <td style={bodyCellRight}>
                      £{Number(inv.totalPrice || 0).toFixed(2)}
                    </td>
                    <td style={bodyCellRight}>
                      £{Number(inv.paidAmount || 0).toFixed(2)}
                    </td>
                    <td style={bodyCellRight}>
                      £{Number(inv.remainingAmount || 0).toFixed(2)}
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
          </div>
        )}

        {/* Pagination Controls */}
        {!searchQuery &&
          !selectedDate &&
          searchWorkType === "All Work Types" &&
          filteredInvoices.length > 5 && (
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
                  style={inputStyle}
                />

                <label>Client Phone</label>
                <input
                  value={editInvoice.clientPhone}
                  onChange={(e) => setEditField("clientPhone", e.target.value)}
                  style={inputStyle}
                />

                <label>Client Address</label>
                <input
                  value={editInvoice.clientAddress}
                  onChange={(e) =>
                    setEditField("clientAddress", e.target.value)
                  }
                  style={inputStyle}
                />

                <label>Post Code</label>
                <input
                  value={editInvoice.postCode}
                  onChange={(e) => setEditField("postCode", e.target.value)}
                  style={inputStyle}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      marginTop: 8,
                      fontWeight: "bold",
                    }}
                  >
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
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        placeholder="name"
                        value={s.name}
                        onChange={(e) =>
                          setServiceField(i, "name", e.target.value)
                        }
                        style={{ ...inputStyle, flex: 2 }}
                      />
                      <input
                        placeholder="price"
                        type="number"
                        value={s.price}
                        onChange={(e) =>
                          setServiceField(i, "price", e.target.value)
                        }
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        placeholder="qty"
                        type="number"
                        value={s.quantity}
                        onChange={(e) =>
                          setServiceField(i, "quantity", e.target.value)
                        }
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => removeService(i)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          padding: "8px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addService}
                    style={{
                      marginTop: 6,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
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
                    style={{ padding: "8px 12px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: "8px 12px",
                      background: "#00D100",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentForm && (
          <div style={modalOverlay}>
            <div style={modal}>
              <h3>Update Payment for Invoice {paymentInvoiceId}</h3>
              <label>Amount Paid (£):</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={inputStyle}
              />

              {parseFloat(paidAmount) >= remainingAmount && (
                <>
                  <label style={{ marginTop: 8, display: "block" }}>
                    Reference Number:
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    style={inputStyle}
                  />

                  <label style={{ marginTop: 8, display: "block" }}>
                    Paid Date:
                  </label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    style={inputStyle}
                  />
                </>
              )}

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button onClick={submitPayment} style={actionBtn}>
                  Submit Payment
                </button>
                <button
                  onClick={closePaymentForm}
                  style={{ ...actionBtn, background: "#ccc", color: "#333" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Invoices Drawer */}
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
                    style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
                  >
                    <strong>#{inv.invoiceNumber}</strong> — {inv.clientName}
                    <br />
                    <span style={{ fontSize: "12px", color: "#555" }}>
                      Remaining: £{Number(inv.remainingAmount).toFixed(2)}
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

/* Common Styles */
const cardStyle = {
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
const headerCellRight = { ...headerCell, textAlign: "right" };
const bodyCell = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "0.95rem",
};
const bodyCellRight = { ...bodyCell, textAlign: "right" };
const actionBtn = {
  background: "#00D100",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "6px",
  marginBottom: "4px",
};
const pillBtn = {
  padding: "6px 12px",
  background: "#fff",
  color: "#000",
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
const dateInput = { padding: 8, borderRadius: 6, border: "1px solid #ccc" };
const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
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
  width: "min(600px, 95%)",
  maxHeight: "90vh",
  overflow: "auto",
};
const globalLoaderOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 99999,
};
const loaderCard = {
  background: "#fff",
  padding: "20px 30px",
  borderRadius: "8px",
  fontSize: "18px",
  fontWeight: "bold",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
