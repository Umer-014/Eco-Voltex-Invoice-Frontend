import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../lib/lib";
import { getInvoiceHtml } from "../utils/invoiceHtml";
import "./SavedInvoices.css";

// Moved outside the component so it never changes and doesn't trigger ESLint warnings
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

const SavedInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchWorkType, setSearchWorkType] = useState("All Work Types");
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Default to the current month (e.g., "2026-08")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const pdfContentRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/invoices");
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      

      // Smart Work Type Matching Logic
      let matchesWorkType = true;
      if (searchWorkType !== "All Work Types" && searchWorkType !== "") {
        const targetKeywords = workTypeKeywords[
          searchWorkType.toLowerCase()
        ] || [searchWorkType.toLowerCase()];

        matchesWorkType = invoice.services?.some((service) => {
          const serviceText = (service.name || "").toLowerCase();
          return targetKeywords.some((keyword) =>
            serviceText.includes(keyword),
          );
        });
      }

      const matchesInvoiceNumber = searchInvoiceNumber
        ? invoice.invoiceNumber?.toString().includes(searchInvoiceNumber)
        : true;

      const matchesName = searchName
        ? invoice.clientName?.toLowerCase().includes(searchName.toLowerCase())
        : true;

      const matchesMonth = selectedMonth
        ? new Date(invoice.createdAt).toISOString().slice(0, 7) ===
          selectedMonth
        : true;

      const matchesDate = selectedDate
        ? new Date(invoice.createdAt).toLocaleDateString() ===
          new Date(selectedDate).toLocaleDateString()
        : true;

      return (

        matchesWorkType &&
        matchesInvoiceNumber &&
        matchesName &&
        matchesDate &&
        matchesMonth
      );
    });
  }, [

    searchWorkType,
    searchInvoiceNumber,
    searchName,
    selectedDate,
    selectedMonth,
    invoices,
  ]);

  const calculateTotalBeforeDiscount = (totalPrice, discount) => {
    const numericTotal = Number(totalPrice) || 0;
    const numericDiscount = Number(discount) || 0;
    if (numericDiscount === 0) {
      return numericTotal.toFixed(2);
    }
    const newTotal = numericTotal / (1 - numericDiscount / 100);
    return newTotal.toFixed(2);
  };

  const printInvoice = (invoiceId) => {
    const invoice = filteredInvoices.find((inv) => inv._id === invoiceId);
    if (!invoice) return;
    const printWindow = window.open("", "", "height=800,width=600");
    printWindow.document.write(getInvoiceHtml(invoice));
    printWindow.document.close();
  };

  const downloadInvoice = (invoiceId) => {
    const invoice = filteredInvoices.find((inv) => inv._id === invoiceId);
    if (!invoice) return;
    const printWindow = window.open("", "", "width=800,height=900");
    printWindow.document.write(getInvoiceHtml(invoice));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  return (
    <div className="container">
      <h1>Saved Invoices</h1>

      <div className="search-filters">
        <select
          value={searchWorkType}
          onChange={(e) => setSearchWorkType(e.target.value)}
        >
          <option value="All Work Types">All Work Types</option>
          <option value="Electrical">Electrical</option>
          <option value="CCTV">CCTV</option>
          <option value="Fire Alarm">Fire Alarm</option>
        </select>

        <input
          type="text"
          placeholder="Invoice Number"
          value={searchInvoiceNumber}
          onChange={(e) => setSearchInvoiceNumber(e.target.value)}
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
            setSearchInvoiceNumber("");
            setSearchName("");
            setSelectedDate("");
            setSelectedMonth("");
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
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "18px",
            color: "white",
          }}
        >
          Loading invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <p
          className="no-invoices"
          style={{ textAlign: "center", color: "white", marginTop: "30px" }}
        >
          No invoices found.
        </p>
      ) : (
        <>
          <div className="total-invoices">
            Showing {filteredInvoices.length} invoice(s)
          </div>
          <div className="invoices-grid">
            {filteredInvoices.map((invoice) => (
              <div
                className="invoice-card"
                key={invoice._id}
                id={`invoice-${invoice._id}`}
              >
                <h3>Invoice Number: {invoice.invoiceNumber}</h3>
                <h3>
                  Created Date:{" "}
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </h3>
                <h3>Client Name: {invoice.clientName}</h3>
                {invoice.clientPhone && (
                  <h3>Phone No/Email: {invoice.clientPhone}</h3>
                )}
                <h3>Category: {invoice.category}</h3>
                <h3>Payment Mode: {invoice.paymentOption}</h3>
                <h4>Services:</h4>
                <ul>
                  {invoice.services.map((service) => (
                    <li key={service._id}>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {service.name}
                      </div>
                      – £{(Number(service.price) || 0).toFixed(2)} (Qty:{" "}
                      {service.quantity})
                    </li>
                  ))}
                </ul>

                <h3>
                  Total Services: £
                  {calculateTotalBeforeDiscount(
                    invoice.totalPrice,
                    invoice.discount,
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
        </>
      )}

      <div
        ref={pdfContentRef}
        style={{ position: "absolute", left: "-9999px" }}
      ></div>
    </div>
  );
};

export default SavedInvoices;