
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/lib";
import "./InvoiceArchive.css";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();

export default function InvoiceArchive() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const years = useMemo(
    () => Array.from(
      { length: Math.max(CURRENT_YEAR - 2025 + 1, 1) },
      (_, i) => String(CURRENT_YEAR - i)
    ),
    []
  );

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoice-archive", {
        params: { year, month }
      });

      setFiles(response.data?.files || []);
    } catch (err) {
      console.error("Invoice archive error:", err);
      setFiles([]);
      setError(
        err.response?.data?.message ||
        "Unable to load invoices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return files;

    return files.filter(file =>
      file.invoiceNumber?.toLowerCase().includes(term) ||
      file.filename?.toLowerCase().includes(term)
    );
  }, [files, search]);

  async function getPdfUrl(file, disposition) {
    setBusyKey(file.key);
    setError("");

    try {
      const response = await api.post("/invoice-archive/url", {
        key: file.key,
        disposition
      });

      if (!response.data?.url) {
        throw new Error("PDF URL was not returned by the server.");
      }

      return response.data.url;
    } catch (err) {
      console.error("PDF request error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to access this PDF."
      );
      return null;
    } finally {
      setBusyKey("");
    }
  }

  async function previewInvoice(file) {
    // Open immediately to avoid browser popup blocking.
    const newWindow = window.open("about:blank", "_blank");

    if (!newWindow) {
      setError("Please allow pop-ups to preview PDF invoices.");
      return;
    }

    newWindow.opener = null;

    const url = await getPdfUrl(file, "inline");

    if (url) {
      newWindow.location.href = url;
    } else {
      newWindow.close();
    }
  }

  async function downloadInvoice(file) {
    const url = await getPdfUrl(file, "attachment");

    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename || "invoice.pdf";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function formatSize(bytes) {
    const size = Number(bytes) || 0;

    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  const selectedMonth = MONTHS[Number(month) - 1];

  return (
    <main className="invoice-archive">

      <header className="archive-heading">
        <div>
          <span className="archive-eyebrow">
            DOCUMENT MANAGEMENT
          </span>

          <h1>Invoice Archive</h1>

          <p>
            Browse, preview and download your archived invoice PDFs.
          </p>
        </div>

        <div className="archive-counter">
          <span>Invoices found</span>
          <strong>{loading ? "—" : files.length}</strong>
        </div>
      </header>

      <section className="archive-filters">

        <label>
          <span>Financial year / calendar year</span>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Select month</span>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="archive-search">
          <span>Search invoice</span>
          <input
            type="search"
            placeholder="e.g. INV-1026-101"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        <button
          className="archive-refresh"
          onClick={loadInvoices}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>

      </section>

      <section className="archive-results">

        <div className="archive-results-heading">
          <div>
            <h2>{selectedMonth} {year}</h2>
            <p>
              {filteredFiles.length} invoice PDF
              {filteredFiles.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {error && (
          <div className="archive-error" role="alert">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {loading ? (
          <div className="archive-empty">
            <div className="archive-spinner" />
            <p>Loading invoice documents...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="archive-empty">
            <div className="archive-empty-icon">PDF</div>
            <h3>No invoices found</h3>
            <p>
              No matching PDF documents were found for
              {" "}{selectedMonth} {year}.
            </p>
          </div>
        ) : (
          <div className="archive-table-wrapper">
            <table className="archive-table">
              <thead>
                <tr>
                  <th>Invoice number</th>
                  <th>File size</th>
                  <th>Last modified</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFiles.map(file => (
                  <tr key={file.key}>
                    <td>
                      <div className="archive-invoice-cell">
                        <span className="archive-pdf-icon">
                          PDF
                        </span>
                        <div>
                          <strong>
                            {file.invoiceNumber || file.filename}
                          </strong>
                          <small>{file.filename}</small>
                        </div>
                      </div>
                    </td>

                    <td>{formatSize(file.size)}</td>

                    <td>
                      {file.lastModified
                        ? new Date(file.lastModified)
                            .toLocaleDateString("en-GB")
                        : "—"}
                    </td>

                    <td>
                      <div className="archive-actions">
                        <button
                          className="archive-preview"
                          disabled={Boolean(busyKey)}
                          onClick={() => previewInvoice(file)}
                        >
                          Preview
                        </button>

                        <button
                          className="archive-download"
                          disabled={Boolean(busyKey)}
                          onClick={() => downloadInvoice(file)}
                        >
                          {busyKey === file.key
                            ? "Preparing..."
                            : "↓ Download"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>

      <footer className="archive-footer">
        Invoice PDFs are accessed through temporary, signed S3 links.
      </footer>

    </main>
  );
}
