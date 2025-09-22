// src/Components/Admin.js
import { useAuth } from "../context/AuthContext";
import api from "../lib/lib";
import { useEffect, useState } from "react";

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
  }, []);



  // stats
  const totalInvoices = invoices.length;
  const TotalInvoiceValue = invoices.reduce(
    (sum, inv) => sum + (Number(inv.totalPrice) || 0),
    0
  );
  const unpaidCount = invoices.filter((inv) => inv.remainingAmount > 0).length;
  const TotalRevenue = invoices.reduce(
    (sum, inv) => sum + (Number(inv.paidAmount) || 0),
    0
  );

  // filtering logic
  const filteredInvoices = invoices.filter((inv) => {
    const nameMatch = inv.clientName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const dateMatch = selectedDate
      ? new Date(inv.createdAt).toLocaleDateString("en-CA") === selectedDate
      : true;
    return nameMatch && dateMatch;
  });

  // show only last 5 if no filters
  const displayedInvoices =
    searchQuery || selectedDate
      ? filteredInvoices
      : filteredInvoices.slice(-5).reverse();

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
        paymentOption: inv.paymentOption || "",
        category: inv.category || "",
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

  // keep submitPayment the same
  function submitPayment() {
    if (isNaN(parseFloat(paidAmount)) || parseFloat(paidAmount) <= 0) {
      alert("Invalid amount entered");
      return;
    }

    fetch(`http://localhost:4000/api/invoices/${paymentInvoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paidAmount: parseFloat(paidAmount),
        referenceNumber: referenceNumber || null,
        paidDate: paidDate || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Payment updated successfully");
        window.location.reload();
      })
      .catch((err) => console.error("Error updating payment:", err))
      .finally(() => closePaymentForm()); // now works
  }

  // Save edited invoice to backend (by invoiceNumber)
  const saveEdit = async () => {
    if (!editInvoice) return;
    setSaving(true);
    try {
      const payload = {
        clientName: editInvoice.clientName,
        clientPhone: editInvoice.clientPhone,
        clientAddress: editInvoice.clientAddress,
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
        payload
      );
      // update local invoices list by invoiceNumber
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceNumber === r.data.invoiceNumber ? r.data : inv
        )
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
      // call your API with invoiceNumber
      await api.delete(`/api/invoices/${invoiceNumber}`);

      // update state by removing the deleted invoice using invoiceNumber
      setInvoices((prev) =>
        prev.filter((i) => i.invoiceNumber !== invoiceNumber)
      );
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete invoice");
    }
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
        {/* Quick stats */}
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
          </div>
          <div style={cardStyle}>
            <h3>Total Invoices Value</h3>
            <p style={statStyle}>£ {TotalInvoiceValue.toLocaleString()}</p>
          </div>
          <div style={cardStyle}>
            <h3>Total Revenue</h3>
            <p style={statStyle}>£ {TotalRevenue.toLocaleString()}</p>
          </div>
          <div style={cardStyle}>
            <h3>Unpaid Invoices</h3>
            <p style={statStyle}>{unpaidCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "32px",
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
                      style={{...actionBtn, background:"blue"}}
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
                <input
                  type="date"
                  value={editInvoice.createdAt}
                  onChange={(e) => setEditField("createdAt", e.target.value)}
                />

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
