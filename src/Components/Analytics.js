import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Analytics.css";
import api from "../lib/lib";

/* ----------------------------------------------------------------------------
   Formatting helpers
---------------------------------------------------------------------------- */
const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });

const money = (n) => gbp0.format(Number(n) || 0);
const money2 = (n) => gbp2.format(Number(n) || 0);
const moneyShort = (n) => `£${compactFmt.format(Number(n) || 0)}`;
const pct0 = (n) => (n == null ? "–" : `${Math.round(n)}%`);
const days = (n) => (n == null ? "–" : `${Math.round(n)} ${Math.round(n) === 1 ? "day" : "days"}`);

const monthShort = (key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
};
const monthLong = (key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
};
const dateFmt = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "–";

const pad = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

/* ----------------------------------------------------------------------------
   Date range presets
---------------------------------------------------------------------------- */
const monthsBack = (n) => () => {
    const t = new Date();
    return { from: toISODate(new Date(t.getFullYear(), t.getMonth() - (n - 1), 1)), to: toISODate(t) };
};
const PRESETS = [
    { id: "all", label: "All time", range: () => ({ from: "", to: "" }) },
    { id: "12m", label: "12 months", range: monthsBack(12) },
    { id: "6m", label: "6 months", range: monthsBack(6) },
    { id: "3m", label: "3 months", range: monthsBack(3) },
    {
        id: "ytd",
        label: "This year",
        range: () => {
            const t = new Date();
            return { from: toISODate(new Date(t.getFullYear(), 0, 1)), to: toISODate(t) };
        },
    },
    { id: "month", label: "This month", range: monthsBack(1) },
];

const CATEGORIES = ["all", "Residential", "Commercial", "Industrial"];
const CATEGORY_COLORS = ["var(--an-c1)", "var(--an-c2)", "var(--an-c3)", "var(--an-c4)", "var(--an-c5)"];

/* ----------------------------------------------------------------------------
   Data loading
---------------------------------------------------------------------------- */
function useAnalytics({ from, to, category }) {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setState((s) => ({ ...s, loading: true, error: null }));

        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        if (category && category !== "all") params.category = category;

        api.get("/analytics", { params, signal: controller.signal })
            .then((res) => setState({ data: res.data, loading: false, error: null }))
            .catch((err) => {
                if (err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError") return;
                const message = (err.response && err.response.data && err.response.data.message) || err.message || "Could not load analytics";
                setState((s) => ({ ...s, loading: false, error: message }));
            });

        return () => controller.abort();
    }, [from, to, category, reloadKey]);

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);
    return { ...state, reload };
}

function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        setWidth(el.clientWidth);
        const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
}

/* ----------------------------------------------------------------------------
   Insight sentences, written from the data
---------------------------------------------------------------------------- */
function buildHighlights(data) {
    const out = [];
    const { kpis, previous, monthly, clientStats, topClients, serviceTypes, settings } = data;
    if (!kpis || !kpis.invoiceCount) return out;

    if (previous && previous.kpis.invoiced > 0) {
        const ch = pctChange(kpis.invoiced, previous.kpis.invoiced);
        out.push({
            tone: ch >= 0 ? "good" : "warn",
            text: `Invoiced ${money(kpis.invoiced)}, ${ch >= 0 ? "up" : "down"} ${Math.abs(Math.round(ch))}% on the previous period (${money(previous.kpis.invoiced)}).`,
        });
    }

    const best = [...monthly].sort((a, b) => b.invoiced - a.invoiced)[0];
    if (best && best.invoiced > 0 && monthly.length > 1) {
        out.push({
            tone: "info",
            text: `${monthLong(best.month)} was the strongest month: ${money(best.invoiced)} from ${best.count} ${best.count === 1 ? "invoice" : "invoices"}.`,
        });
    }

    if (kpis.outstanding > 0) {
        const overdue = kpis.overdueAmount > 0
            ? ` ${money(kpis.overdueAmount)} of it is more than ${settings.dueDays} days old across ${kpis.overdueCount} ${kpis.overdueCount === 1 ? "invoice" : "invoices"}.`
            : ` None of it is past ${settings.dueDays} days.`;
        out.push({
            tone: kpis.overdueAmount > 0 ? "bad" : "info",
            text: `${money(kpis.outstanding)} is still waiting to be paid.${overdue}`,
        });
    } else {
        out.push({ tone: "good", text: "Every invoice in this period has been paid in full." });
    }

    if (clientStats.totalClients > 1 && topClients[0]) {
        const heavy = clientStats.top5Share > 50;
        out.push({
            tone: heavy ? "warn" : "info",
            text: `${topClients[0].name} is ${Math.round(clientStats.top1Share)}% of revenue, and your top five clients make up ${Math.round(clientStats.top5Share)}%${heavy ? ", so losing one or two would be noticeable." : "."}`,
        });
    }

    if (clientStats.totalClients > 4) {
        out.push({
            tone: "info",
            text: `${clientStats.repeatClients} of ${clientStats.totalClients} clients came back for more work, and they account for ${Math.round(clientStats.repeatRevenueShare)}% of revenue.`,
        });
    }

    if (serviceTypes[0]) {
        out.push({
            tone: "info",
            text: `${serviceTypes[0].name} is the biggest line of work at ${money(serviceTypes[0].revenue)} (${Math.round(serviceTypes[0].share)}% of line items).`,
        });
    }

    if (kpis.avgDaysToPay != null) {
        out.push({
            tone: "info",
            text: `Paid invoices take ${days(kpis.avgDaysToPay)} on average, but half are paid within ${days(kpis.medianDaysToPay)}.`,
        });
    }

    return out.slice(0, 7);
}

/* ----------------------------------------------------------------------------
   CSV export
---------------------------------------------------------------------------- */
function downloadCSV(rows, filename) {
    const head = ["Invoice", "Client", "Category", "Date", "Total", "Paid", "Remaining", "Discount", "Status", "Paid date", "Days to pay", "Days open"];
    const esc = (v) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) =>
        [
            r.invoiceNumber, r.clientName, r.category, r.createdAt.slice(0, 10), r.total, r.paid, r.remaining, r.discount,
            r.status, r.paidDate ? r.paidDate.slice(0, 10) : "", r.daysToPay ?? "", r.ageDays ?? "",
        ].map(esc).join(",")
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------------------
   Small presentational pieces
---------------------------------------------------------------------------- */
function Delta({ value, invert = false }) {
    if (value == null || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded === 0) return <span className="an-delta an-delta--flat">no change</span>;
    const up = rounded > 0;
    const good = invert ? !up : up;
    return (
        <span className={`an-delta ${good ? "an-delta--good" : "an-delta--bad"}`}>
            {up ? "▲" : "▼"} {Math.abs(rounded)}%
        </span>
    );
}

function Panel({ title, note, className = "", children, action }) {
    return (
        <section className={`an-panel ${className}`}>
            <header className="an-panel__head">
                <div>
                    <h2>{title}</h2>
                    {note && <p>{note}</p>}
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}

function Empty({ children = "No data for these filters." }) {
    return <div className="an-empty">{children}</div>;
}

function StatusBadge({ status, overdue }) {
    const label = overdue ? "Overdue" : status === "paid" ? "Paid" : status === "partial" ? "Part paid" : "Unpaid";
    const tone = overdue ? "bad" : status;
    return <span className={`an-badge an-badge--${tone}`}>{label}</span>;
}

/* ----------------------------------------------------------------------------
   Hero: where the money is
---------------------------------------------------------------------------- */
function CashPosition({ kpis, previous }) {
    const overdue = Math.min(kpis.overdueAmount, kpis.outstanding);
    const waiting = Math.max(0, kpis.outstanding - overdue);
    const total = kpis.collected + waiting + overdue || 1;
    const seg = (v) => `${(v / total) * 100}%`;
    const prev = previous ? previous.kpis : null;

    return (
        <section className="an-hero" aria-label="Cash position">
            <div className="an-hero__top">
                <div>
                    <p className="an-hero__label">Invoiced</p>
                    <p className="an-hero__value">{money(kpis.invoiced)}</p>
                    <p className="an-hero__sub">
                        {kpis.invoiceCount} {kpis.invoiceCount === 1 ? "invoice" : "invoices"} for {kpis.clientCount} {kpis.clientCount === 1 ? "client" : "clients"}
                        {prev && prev.invoiced > 0 && (
                            <>
                                {" "}
                                <Delta value={pctChange(kpis.invoiced, prev.invoiced)} /> <span className="an-muted">vs previous period</span>
                            </>
                        )}
                    </p>
                </div>
                <div className="an-hero__rate">
                    <p className="an-hero__rate-value">{pct0(kpis.collectionRate)}</p>
                    <p className="an-hero__label">collected</p>
                </div>
            </div>

            <div className="an-cashbar" role="img" aria-label={`Collected ${money(kpis.collected)}, waiting ${money(waiting)}, overdue ${money(overdue)}`}>
                {kpis.collected > 0 && <span className="an-cashbar__seg an-cashbar__seg--paid" style={{ width: seg(kpis.collected) }} />}
                {waiting > 0 && <span className="an-cashbar__seg an-cashbar__seg--wait" style={{ width: seg(waiting) }} />}
                {overdue > 0 && <span className="an-cashbar__seg an-cashbar__seg--late" style={{ width: seg(overdue) }} />}
            </div>

            <dl className="an-cashlegend">
                <div>
                    <dt><i className="an-dot an-dot--paid" />Collected</dt>
                    <dd>{money(kpis.collected)}</dd>
                </div>
                <div>
                    <dt><i className="an-dot an-dot--wait" />Waiting to be paid</dt>
                    <dd>{money(waiting)}</dd>
                </div>
                <div>
                    <dt><i className="an-dot an-dot--late" />Overdue</dt>
                    <dd>
                        {money(overdue)}
                        {kpis.overdueCount > 0 && <span className="an-muted"> in {kpis.overdueCount}</span>}
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function KpiStrip({ kpis, previous, clientStats }) {
    const prev = previous ? previous.kpis : null;
    const items = [
        { label: "Average invoice", value: money(kpis.avgInvoice), delta: prev && pctChange(kpis.avgInvoice, prev.avgInvoice) },
        { label: "Largest invoice", value: money(kpis.largestInvoice) },
        { label: "Invoices raised", value: kpis.invoiceCount, delta: prev && pctChange(kpis.invoiceCount, prev.invoiceCount) },
        { label: "Repeat clients", value: `${clientStats.repeatClients} of ${clientStats.totalClients}` },
        { label: "Typical time to pay", value: days(kpis.medianDaysToPay), sub: kpis.avgDaysToPay != null ? `average ${days(kpis.avgDaysToPay)}` : null },
        { label: "Discounts given", value: money(kpis.discounts) },
    ];
    return (
        <div className="an-kpis">
            {items.map((it) => (
                <div className="an-kpi" key={it.label}>
                    <p className="an-kpi__label">{it.label}</p>
                    <p className="an-kpi__value">{it.value}</p>
                    <p className="an-kpi__sub">
                        {it.delta != null && <Delta value={it.delta} />}
                        {it.sub && <span className="an-muted">{it.sub}</span>}
                    </p>
                </div>
            ))}
        </div>
    );
}

function Highlights({ items }) {
    if (!items.length) return null;
    return (
        <Panel title="What stands out" className="an-panel--wide">
            <ul className="an-highlights">
                {items.map((h, i) => (
                    <li key={i} className={`an-highlights__item an-highlights__item--${h.tone}`}>
                        {h.text}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

/* ----------------------------------------------------------------------------
   Charts (plain SVG, no dependency)
---------------------------------------------------------------------------- */
function niceStep(raw) {
    if (raw <= 0) return 1;
    const exp = 10 ** Math.floor(Math.log10(raw));
    const f = raw / exp;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
}

function MonthlyChart({ data }) {
    const [ref, width] = useWidth();
    const [hover, setHover] = useState(null);
    const height = 300;
    const m = { top: 14, right: 12, bottom: 30, left: 46 };
    const plotW = Math.max(0, width - m.left - m.right);
    const plotH = height - m.top - m.bottom;

    const maxVal = Math.max(1, ...data.map((d) => Math.max(d.invoiced, d.collected)));
    const step = niceStep(maxVal / 4);
    const yMax = step * Math.ceil(maxVal / step);
    const ticks = [];
    for (let v = 0; v <= yMax + 0.0001; v += step) ticks.push(v);

    const groupW = data.length ? plotW / data.length : 0;
    const barW = Math.max(2, Math.min(26, groupW * 0.34));
    const y = (v) => m.top + plotH - (v / yMax) * plotH;
    const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 54))));

    const h = hover != null ? data[hover] : null;
    const tipLeft = h ? Math.min(Math.max(m.left + groupW * hover + groupW / 2, 90), Math.max(90, width - 90)) : 0;

    return (
        <div className="an-chart" ref={ref}>
            {width > 0 && (
                <svg width={width} height={height} role="img" aria-label="Invoiced and collected by month">
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} className="an-grid" />
                            <text x={m.left - 8} y={y(t) + 4} textAnchor="end" className="an-axis">{moneyShort(t)}</text>
                        </g>
                    ))}
                    {data.map((d, i) => {
                        const cx = m.left + groupW * i + groupW / 2;
                        return (
                            <g key={d.month}>
                                {hover === i && <rect x={m.left + groupW * i} y={m.top} width={groupW} height={plotH} className="an-hoverband" />}
                                <rect x={cx - barW - 1} y={y(d.invoiced)} width={barW} height={Math.max(0, m.top + plotH - y(d.invoiced))} rx="2" className="an-bar an-bar--invoiced" />
                                <rect x={cx + 1} y={y(d.collected)} width={barW} height={Math.max(0, m.top + plotH - y(d.collected))} rx="2" className="an-bar an-bar--collected" />
                                {i % labelEvery === 0 && (
                                    <text x={cx} y={height - 9} textAnchor="middle" className="an-axis">{monthShort(d.month)}</text>
                                )}
                                <rect
                                    x={m.left + groupW * i} y={m.top} width={groupW} height={plotH} fill="transparent"
                                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i === hover ? null : i)}
                                />
                            </g>
                        );
                    })}
                </svg>
            )}
            {h && (
                <div className="an-tip" style={{ left: tipLeft }}>
                    <strong>{monthLong(h.month)}</strong>
                    <span><i className="an-dot an-dot--invoiced" />Invoiced {money(h.invoiced)}</span>
                    <span><i className="an-dot an-dot--paid" />Collected {money(h.collected)}</span>
                    {h.outstanding > 0 && <span><i className="an-dot an-dot--wait" />Unpaid {money(h.outstanding)}</span>}
                    <span className="an-muted">{h.count} {h.count === 1 ? "invoice" : "invoices"}</span>
                </div>
            )}
            <div className="an-legend">
                <span><i className="an-dot an-dot--invoiced" />Invoiced</span>
                <span><i className="an-dot an-dot--paid" />Collected</span>
            </div>
        </div>
    );
}

function Donut({ items }) {
    const size = 168;
    const r = 62;
    const stroke = 26;
    const c = 2 * Math.PI * r;
    const total = items.reduce((s, i) => s + i.revenue, 0) || 1;
    let offset = 0;
    return (
        <div className="an-donut">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Revenue by category">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="an-donut__track" strokeWidth={stroke} />
                {items.map((it, i) => {
                    const len = (it.revenue / total) * c;
                    const el = (
                        <circle
                            key={it.name} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
                            stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                            strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
                            strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        />
                    );
                    offset += len;
                    return el;
                })}
                <text x="50%" y="48%" textAnchor="middle" className="an-donut__num">{moneyShort(total)}</text>
                <text x="50%" y="62%" textAnchor="middle" className="an-axis">invoiced</text>
            </svg>
            <ul className="an-donut__legend">
                {items.map((it, i) => (
                    <li key={it.name}>
                        <span className="an-donut__name"><i className="an-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />{it.name}</span>
                        <span className="an-donut__figs">
                            <strong>{money(it.revenue)}</strong>
                            <span className="an-muted">{Math.round(it.share)}%, {it.count} {it.count === 1 ? "invoice" : "invoices"}, avg {money(it.avgInvoice)}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BarList({ rows, color = "var(--an-c1)", valueFormat = money }) {
    if (!rows.length) return <Empty />;
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (
        <ul className="an-barlist">
            {rows.map((r) => (
                <li key={r.label}>
                    <div className="an-barlist__row">
                        <span className="an-barlist__label" title={r.label}>{r.label}</span>
                        <span className="an-barlist__value">{valueFormat(r.value)}</span>
                    </div>
                    <div className="an-barlist__track">
                        <span style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: r.color || color }} />
                    </div>
                    {r.sub && <span className="an-barlist__sub">{r.sub}</span>}
                </li>
            ))}
        </ul>
    );
}

function ColumnChart({ rows, color = "var(--an-c1)", valueKey = "count", format = (v) => v, emptyText }) {
    const max = Math.max(...rows.map((r) => r[valueKey]), 0);
    if (!max) return <Empty>{emptyText}</Empty>;
    return (
        <div className="an-columns">
            {rows.map((r) => (
                <div className="an-columns__col" key={r.label}>
                    <span className="an-columns__val">{format(r[valueKey])}</span>
                    <div className="an-columns__bar"><span style={{ height: `${(r[valueKey] / max) * 100}%`, background: color }} /></div>
                    <span className="an-columns__label">{r.label}</span>
                </div>
            ))}
        </div>
    );
}

function Aging({ aging, kpis }) {
    const total = aging.reduce((s, b) => s + b.amount, 0);
    if (total <= 0) return <Empty>Nothing is waiting to be paid.</Empty>;
    const tones = ["var(--an-wait)", "var(--an-wait-deep)", "var(--an-late)", "var(--an-late-deep)"];
    return (
        <div>
            <div className="an-aging__bar">
                {aging.map((b, i) => b.amount > 0 && <span key={b.label} style={{ width: `${(b.amount / total) * 100}%`, background: tones[i] }} title={`${b.label}: ${money(b.amount)}`} />)}
            </div>
            <ul className="an-aging__list">
                {aging.map((b, i) => (
                    <li key={b.label}>
                        <span><i className="an-dot" style={{ background: tones[i] }} />{b.label}</span>
                        <span><strong>{money(b.amount)}</strong> <span className="an-muted">{b.count} {b.count === 1 ? "invoice" : "invoices"}</span></span>
                    </li>
                ))}
            </ul>
            <p className="an-footnote">Age is counted from the invoice date. {kpis.overdueCount} of {kpis.unpaidCount} unpaid {kpis.unpaidCount === 1 ? "invoice is" : "invoices are"} past the due window.</p>
        </div>
    );
}

/* ----------------------------------------------------------------------------
   Tables
---------------------------------------------------------------------------- */
function OutstandingTable({ rows }) {
    if (!rows.length) return <Empty>No unpaid invoices. Nice.</Empty>;
    return (
        <div className="an-tablewrap">
            <table className="an-table">
                <thead>
                    <tr><th>Invoice</th><th>Client</th><th>Raised</th><th className="an-num">Open for</th><th className="an-num">Total</th><th className="an-num">Still owed</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id}>
                            <td className="an-mono">{r.invoiceNumber}</td>
                            <td>{r.clientName}</td>
                            <td>{dateFmt(r.createdAt)}</td>
                            <td className="an-num">{days(r.ageDays)}</td>
                            <td className="an-num">{money2(r.total)}</td>
                            <td className="an-num"><strong>{money2(r.remaining)}</strong></td>
                            <td><StatusBadge status={r.status} overdue={r.overdue} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const PAGE_SIZE = 12;
const COLUMNS = [
    { key: "invoiceNumber", label: "Invoice" },
    { key: "clientName", label: "Client" },
    { key: "category", label: "Category" },
    { key: "createdAt", label: "Date" },
    { key: "total", label: "Total", num: true },
    { key: "remaining", label: "Owed", num: true },
    { key: "daysToPay", label: "Days to pay", num: true },
    { key: "status", label: "Status" },
];

function InvoiceTable({ rows }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = rows.filter((r) => {
            if (status === "overdue" ? !r.overdue : status !== "all" && r.status !== status) return false;
            return !q || r.clientName.toLowerCase().includes(q) || r.invoiceNumber.toLowerCase().includes(q);
        });
        const dir = sort.dir === "asc" ? 1 : -1;
        return [...list].sort((a, b) => {
            const av = a[sort.key];
            const bv = b[sort.key];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return (typeof av === "number" ? av - bv : String(av).localeCompare(String(bv))) * dir;
        });
    }, [rows, query, status, sort]);

    useEffect(() => setPage(0), [query, status, sort, rows]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "clientName" || key === "invoiceNumber" ? "asc" : "desc" }));

    return (
        <div>
            <div className="an-tools">
                <input className="an-input an-input--search" type="search" placeholder="Search client or invoice number" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search invoices" />
                <select className="an-input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                    <option value="all">All statuses</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Part paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                </select>
                <button type="button" className="an-btn" onClick={() => downloadCSV(filtered, `invoices-${toISODate(new Date())}.csv`)} disabled={!filtered.length}>
                    Download CSV
                </button>
            </div>

            <div className="an-tablewrap">
                <table className="an-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((c) => (
                                <th key={c.key} className={c.num ? "an-num" : ""} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                                    <button type="button" className="an-sortbtn" onClick={() => toggleSort(c.key)}>
                                        {c.label}
                                        <span className="an-sortbtn__arrow">{sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}</span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((r) => (
                            <tr key={r.id}>
                                <td className="an-mono">{r.invoiceNumber}</td>
                                <td>{r.clientName}</td>
                                <td>{r.category}</td>
                                <td>{dateFmt(r.createdAt)}</td>
                                <td className="an-num">{money2(r.total)}</td>
                                <td className="an-num">{r.remaining > 0 ? money2(r.remaining) : "–"}</td>
                                <td className="an-num">{r.daysToPay != null ? r.daysToPay : "–"}</td>
                                <td><StatusBadge status={r.status} overdue={r.overdue} /></td>
                            </tr>
                        ))}
                        {!visible.length && (
                            <tr><td colSpan={COLUMNS.length}><Empty>No invoices match your search.</Empty></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="an-pager">
                <span className="an-muted">
                    {filtered.length ? `${page * PAGE_SIZE + 1} to ${Math.min(filtered.length, (page + 1) * PAGE_SIZE)} of ${filtered.length}` : "0 invoices"}
                </span>
                <div>
                    <button type="button" className="an-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
                    <button type="button" className="an-btn" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>Next</button>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------------------
   Page
---------------------------------------------------------------------------- */
function Skeleton() {
    return (
        <div className="an-skeleton" aria-busy="true" aria-label="Loading analytics">
            <div className="an-skeleton__hero" />
            <div className="an-skeleton__row"><span /><span /><span /></div>
            <div className="an-skeleton__chart" />
        </div>
    );
}

export default function Analytics() {
    const [filters, setFilters] = useState({ preset: "all", from: "", to: "", category: "all" });
    const { data, loading, error, reload } = useAnalytics(filters);

    const choosePreset = (p) => setFilters((f) => ({ ...f, preset: p.id, ...p.range() }));
    const changeDate = (key, value) => setFilters((f) => ({ ...f, preset: "custom", [key]: value }));

    const highlights = useMemo(() => (data ? buildHighlights(data) : []), [data]);
    const rangeText = data && data.bounds ? `${dateFmt(data.bounds.first)} to ${dateFmt(data.bounds.last)}` : "";
    const refreshed = data ? new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
    const hasRows = data && data.kpis && data.kpis.invoiceCount > 0;

    return (
        <main className="an-page">
            <header className="an-header">
                <div>
                    <h1>Analytics</h1>
                    <p className="an-header__sub">
                        {data && data.bounds
                            ? `${data.bounds.totalInvoices} invoices on record, from ${rangeText}.`
                            : "Revenue, payments and clients from your invoices."}
                    </p>
                </div>

                <div className="an-controls">
                    <div className="an-segment" role="group" aria-label="Date range">
                        {PRESETS.map((p) => (
                            <button key={p.id} type="button" className={filters.preset === p.id ? "is-active" : ""} aria-pressed={filters.preset === p.id} onClick={() => choosePreset(p)}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="an-controls__row">
                        <label className="an-field">
                            <span>From</span>
                            <input className="an-input" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => changeDate("from", e.target.value)} />
                        </label>
                        <label className="an-field">
                            <span>To</span>
                            <input className="an-input" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => changeDate("to", e.target.value)} />
                        </label>
                        <label className="an-field">
                            <span>Category</span>
                            <select className="an-input" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
                            </select>
                        </label>
                        <button type="button" className="an-btn an-btn--solid" onClick={reload} disabled={loading}>
                            {loading ? "Loading" : "Refresh"}
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="an-alert" role="alert">
                    <div>
                        <strong>Analytics did not load.</strong>
                        <p>{error}. Check that the /analytics route is deployed and that CORS allows this app, then try again.</p>
                    </div>
                    <button type="button" className="an-btn" onClick={reload}>Try again</button>
                </div>
            )}

            {!data && loading && <Skeleton />}

            {data && !hasRows && !error && (
                <Empty>No invoices match these filters. Widen the dates or choose all categories.</Empty>
            )}

            {data && hasRows && (
                <div className={`an-body ${loading ? "is-loading" : ""}`}>
                    <CashPosition kpis={data.kpis} previous={data.previous} />
                    <KpiStrip kpis={data.kpis} previous={data.previous} clientStats={data.clientStats} />
                    <Highlights items={highlights} />

                    <div className="an-grid-2 an-grid-2--wide-left">
                        <Panel title="Invoiced and collected by month" note="Each month shows invoices raised that month and how much of that has been paid.">
                            <MonthlyChart data={data.monthly} />
                        </Panel>
                        <Panel title="Revenue by category">
                            <Donut items={data.categories} />
                        </Panel>
                    </div>

                    <div className="an-grid-2">
                        <Panel title="Where the work comes from" note="Invoice lines sorted by type of job, before discounts.">
                            <BarList
                                rows={data.serviceTypes.map((s) => ({ label: s.name, value: s.revenue, sub: `${Math.round(s.share)}% of line items` }))}
                                color="var(--an-c2)"
                            />
                        </Panel>
                        <Panel title="Top clients" note={`${data.clientStats.totalClients} clients in this period.`}>
                            <BarList
                                rows={data.topClients.map((c) => ({
                                    label: c.name,
                                    value: c.revenue,
                                    sub: `${c.count} ${c.count === 1 ? "invoice" : "invoices"}, last on ${dateFmt(c.lastInvoice)}${c.outstanding > 0 ? `, owes ${money(c.outstanding)}` : ""}`,
                                }))}
                                color="var(--an-c1)"
                            />
                        </Panel>
                    </div>

                    <div className="an-grid-3">
                        <Panel title="Busiest areas" note="By postcode district of the job site.">
                            <BarList rows={data.areas.map((a) => ({ label: a.name, value: a.revenue, sub: `${a.count} ${a.count === 1 ? "invoice" : "invoices"}` }))} color="var(--an-c3)" />
                        </Panel>
                        <Panel title="Invoice sizes" note="How many invoices fall in each price band.">
                            <ColumnChart rows={data.sizeBuckets} color="var(--an-c4)" />
                        </Panel>
                        <Panel title="How fast clients pay" note={data.daysToPay.sample ? `Based on ${data.daysToPay.sample} paid invoices with a paid date.` : undefined}>
                            <ColumnChart rows={data.daysToPay.buckets} color="var(--an-c1)" emptyText="No paid dates recorded in this period." />
                        </Panel>
                    </div>

                    <div className="an-grid-2 an-grid-2--wide-right">
                        <Panel title="Unpaid by age">
                            <Aging aging={data.aging} kpis={data.kpis} />
                        </Panel>
                        <Panel title="Unpaid invoices" note={`Oldest first. Overdue means more than ${data.settings.dueDays} days since the invoice date.`}>
                            <OutstandingTable rows={data.outstanding} />
                        </Panel>
                    </div>

                    <Panel title="All invoices" className="an-panel--wide">
                        <InvoiceTable rows={data.invoices} />
                    </Panel>

                    <p className="an-footnote an-footnote--page">Updated at {refreshed}. Figures use the invoice date and the amounts stored on each invoice.</p>
                </div>
            )}
        </main>
    );
}