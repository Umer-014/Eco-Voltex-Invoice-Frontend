import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/lib";
import "./Analytics.css";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const shortCurrency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
  notation: "compact",
});

const numberFormat = new Intl.NumberFormat("en-GB");

const emptyAnalytics = {
  range: { startDate: "", endDate: "" },
  invoices: {
    count: 0,
    totalValue: 0,
    paidAmount: 0,
    remainingAmount: 0,
    averageValue: 0,
  },
  monthly: [],
  categories: [],
  workTypes: [],
  unpaidInvoices: [],
};

const getPresetRange = (preset) => {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const start = new Date(end);

  if (preset === "30d") {
    start.setUTCDate(start.getUTCDate() - 29);
  } else if (preset === "90d") {
    start.setUTCDate(start.getUTCDate() - 89);
  } else if (preset === "fy") {
    const year =
      now.getMonth() >= 10 ? now.getFullYear() : now.getFullYear() - 1;
    start.setUTCFullYear(year, 10, 1);
    end.setUTCFullYear(year + 1, 9, 31);
  } else {
    start.setUTCMonth(start.getUTCMonth() - 11, 1);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("12m");
  const [range, setRange] = useState(() => getPresetRange("12m"));
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/analytics", { params: range });
      setAnalytics({ ...emptyAnalytics, ...(response.data || {}) });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Unable to load analytics right now.");
      setAnalytics(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const collectionRate = useMemo(() => {
    if (!analytics.invoices.totalValue) return 0;
    return Math.round(
      (analytics.invoices.paidAmount / analytics.invoices.totalValue) * 100,
    );
  }, [analytics]);

  // Filter monthly data for the chart if a specific month is selected from the dropdown
  const filteredMonthly = useMemo(() => {
    if (!selectedMonth) return analytics.monthly;
    return analytics.monthly.filter((item) => item.month === selectedMonth);
  }, [analytics.monthly, selectedMonth]);

  const maxMonthlyValue = Math.max(
    1,
    ...filteredMonthly.map((item) => item.invoiceValue || 0),
  );

  const maxCategoryValue = Math.max(
    1,
    ...analytics.categories.map((item) => item.totalValue || 0),
  );

  const maxWorkTypeCount = Math.max(
    1,
    ...analytics.workTypes.map((item) => item.count || 0),
  );

  const applyPreset = (nextPreset) => {
    setPreset(nextPreset);
    setSelectedMonth("");
    setRange(getPresetRange(nextPreset));
  };

  const handleMonthSelect = (event) => {
    const monthKey = event.target.value;
    setSelectedMonth(monthKey);

    if (monthKey) {
      // Set range strictly to cover the chosen month (YYYY-MM)
      const [year, month] = monthKey.split("-");
      const startDate = `${year}-${month}-01`;
      
      // Calculate last day of the month
      const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
      const endDate = `${year}-${month}-${lastDay}`;

      setPreset("custom");
      setRange({ startDate, endDate });
    }
  };

  return (
    <div className="analytics-page">
      <section className="analytics-header">
        <div>
          <p className="analytics-kicker">Business Overview</p>
          <h1>Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            Track revenue, payment health, and service breakdown in one view.
          </p>
        </div>

        <div className="analytics-controls">
          <div className="preset-group" aria-label="Analytics period presets">
            {[
              ["30d", "30 days"],
              ["90d", "90 days"],
              ["12m", "12 months"],
              ["fy", "Financial year"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={preset === value ? "active" : ""}
                onClick={() => applyPreset(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="date-range">
            <select
              className="month-dropdown"
              value={selectedMonth}
              onChange={handleMonthSelect}
            >
              <option value="">All months in range</option>
              {analytics.monthly.map((item) => (
                <option key={item.month} value={item.month}>
                  {item.label} ({item.month})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={range.startDate}
              onChange={(event) => {
                setPreset("custom");
                setSelectedMonth("");
                setRange((current) => ({
                  ...current,
                  startDate: event.target.value,
                }));
              }}
            />
            <span>to</span>
            <input
              type="date"
              value={range.endDate}
              onChange={(event) => {
                setPreset("custom");
                setSelectedMonth("");
                setRange((current) => ({
                  ...current,
                  endDate: event.target.value,
                }));
              }}
            />
          </div>
        </div>
      </section>

      {error && <div className="analytics-error">{error}</div>}

      <section className="metric-grid">
        <div className="metric-card primary">
          <span>Total Invoice Value</span>
          <strong>{currency.format(analytics.invoices.totalValue)}</strong>
          <small>
            {numberFormat.format(analytics.invoices.count)} invoices issued
          </small>
        </div>
        <div className="metric-card">
          <span>Revenue Collected</span>
          <strong>{currency.format(analytics.invoices.paidAmount)}</strong>
          <small>{collectionRate}% collection rate</small>
        </div>
        <div className="metric-card warning">
          <span>Outstanding Balance</span>
          <strong>{currency.format(analytics.invoices.remainingAmount)}</strong>
          <small>Pending payments</small>
        </div>
        <div className="metric-card">
          <span>Average Invoice</span>
          <strong>{currency.format(analytics.invoices.averageValue)}</strong>
          <small>Mean bill value</small>
        </div>
      </section>

      <section className="analytics-layout">
        <div className="analytics-panel trend-panel">
          <div className="panel-title-row">
            <div>
              <h2>Monthly Revenue Trend</h2>
              <p>Invoice revenue breakdown with exact values</p>
            </div>
          </div>

          <div className="trend-chart">
            {loading ? (
              <div className="analytics-loading">Loading analytics...</div>
            ) : (
              filteredMonthly.map((item) => (
                <div className="trend-column" key={item.month}>
                  <div className="trend-bars">
                    <span className="bar-value">
                      {shortCurrency.format(item.invoiceValue || 0)}
                    </span>
                    <span
                      className="bar invoice"
                      style={{
                        height: `${Math.max(
                          12,
                          ((item.invoiceValue || 0) / maxMonthlyValue) * 100,
                        )}%`,
                      }}
                      title={`Revenue ${currency.format(item.invoiceValue || 0)}`}
                    ></span>
                  </div>
                  <small>{item.label || item.month}</small>
                </div>
              ))
            )}
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-dot invoice"></i>Monthly Revenue Value
            </span>
          </div>
        </div>

        <div className="analytics-panel">
          <h2>Category Revenue</h2>
          <div className="rank-list">
            {analytics.categories.map((item) => (
              <div className="rank-row" key={item.name}>
                <div className="rank-label">
                  <span>{item.name}</span>
                  <strong>{shortCurrency.format(item.totalValue || 0)}</strong>
                </div>
                <div className="track">
                  <span
                    style={{
                      width: `${((item.totalValue || 0) / maxCategoryValue) * 100}%`,
                    }}
                  ></span>
                </div>
              </div>
            ))}
            {!loading && analytics.categories.length === 0 && (
              <p className="empty-note">No category data in this period.</p>
            )}
          </div>
        </div>

        <div className="analytics-panel">
          <h2>Work Types</h2>
          <div className="rank-list compact">
            {analytics.workTypes.map((item) => (
              <div className="rank-row" key={item.name}>
                <div className="rank-label">
                  <span>{item.name}</span>
                  <strong>{numberFormat.format(item.count)}</strong>
                </div>
                <div className="track green">
                  <span
                    style={{
                      width: `${((item.count || 0) / maxWorkTypeCount) * 100}%`,
                    }}
                  ></span>
                </div>
              </div>
            ))}
            {!loading && analytics.workTypes.length === 0 && (
              <p className="empty-note">No work type data in this period.</p>
            )}
          </div>
        </div>

        <div className="analytics-panel">
          <h2>Largest Unpaid</h2>
          <div className="table-list">
            {analytics.unpaidInvoices.map((invoice) => (
              <div className="table-row" key={invoice.invoiceNumber}>
                <div>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{invoice.clientName || "Unknown client"}</span>
                </div>
                <b>{currency.format(invoice.remainingAmount || 0)}</b>
              </div>
            ))}
            {!loading && analytics.unpaidInvoices.length === 0 && (
              <p className="empty-note">No unpaid invoices in this period.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;