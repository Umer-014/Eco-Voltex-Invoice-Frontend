import logo from "../assets/logo.jpg";
import certificateLogo from "../assets/Certification.jpg";

const calculateTotalBeforeDiscount = (totalPrice, discount) => {
  const newTotal = totalPrice + (discount || 0);
  return newTotal.toFixed(2);
};

const getNotesList = (invoice) => {
  const normalizeNoteItem = (item) =>
    String(item || "")
      .split(/\r?\n|•|·|\u2022|;|,|\|/)
      .map((part) => part.replace(/^[\s\-\*]+/, "").trim())
      .filter(Boolean);

  const rawNotes =
    invoice?.notes ??
    invoice?.invoiceNotes ??
    invoice?.terms ??
    invoice?.note ??
    [];

  if (Array.isArray(rawNotes)) {
    return rawNotes.flatMap((item) => normalizeNoteItem(item));
  }

  if (typeof rawNotes === "string") {
    return normalizeNoteItem(rawNotes);
  }

  if (rawNotes && typeof rawNotes === "object") {
    const nestedList = rawNotes.items || rawNotes.lines || rawNotes.values;
    if (Array.isArray(nestedList)) {
      return nestedList.flatMap((item) => normalizeNoteItem(item));
    }

    const textValue = rawNotes.text || rawNotes.description || rawNotes.message;
    if (typeof textValue === "string") {
      return getNotesList({ notes: textValue });
    }
  }

  return [];
};

export const getInvoiceHtml = (invoice, forPdf = false) => {
  const serviceSubtotal = (invoice.services || []).reduce(
    (sum, service) =>
      sum + (Number(service.price) || 0) * (Number(service.quantity) || 0),
    0,
  );

  const materialSubtotal =
    invoice.hasMaterial && Array.isArray(invoice.materials)
      ? invoice.materials.reduce(
          (sum, material) =>
            sum +
            (Number(material.price) || 0) * (Number(material.quantity) || 0),
          0,
        )
      : 0;

  const notesList = getNotesList(invoice);
  const visibleNotes = notesList.length ? notesList : [
    "Payment due within 7 days of invoice date.",
    "Please include the invoice number on all payments.",
    "Any additional work requested after this invoice will be billed separately.",
  ];

  return `
      <html>
      <head>
        <title>Invoice</title>
        <style>
          :root { --header-h: 176px; --footer-h: 60px; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          html, body { height: 100%; }
          .invoice-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; }
          .print-header { position: fixed; top: 0; left: 0; right: 0; z-index: 20; background: #f9f9f9; color: black; height: var(--header-h); box-sizing: border-box; overflow: hidden; }
          .print-header .fixed-inner { max-width: 800px; margin: 0 auto; padding: 14px 20px 10px; box-sizing: border-box; }
          .header-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: end;
            gap: 20px;
          }
          .header-copy {
            grid-column: 2;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .header-copy h1 {
            margin: 0;
            color: black;
            font-size: 28px;
            text-align: center;
            width: 100%;
          }
          .header-copy p { margin: 5px 0; font-size: 14px; color: black; text-align: center; }
          .header-copy a { color: black; text-decoration: none; }
          .header-logo {
            grid-column: 3;
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            flex: 0 0 auto;
            height: 100%;
          }
          .logo {
            max-width: 180px;
            max-height: 100px;
            display: block;
            transform: translateY(2px);
          }
          .payment-section {
            margin-bottom: 12px;
            border: 2px solid #000000;
            padding: 10px 12px 8px;
            box-sizing: border-box;
            width: 100%;
          }
          .payment-section-title {
            display: block;
            margin: 0 0 8px;
            font-weight: bold;
            font-size: 14px;
          }
          .payment-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 18px;
            font-size: 14px;
            line-height: 1.5;
          }
          .payment-details p {
            margin: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .client-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            border: 2px solid #000000;
            padding: 10px;
            width: 100%;
            box-sizing: border-box;
            gap: 10px;
          }
          .invoice-details {
            display: block;
            margin-bottom: 10px;
            padding: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .client-info p { margin: 5px 0; line-height: 1.4; }
          .client-details { flex: 0 0 60%; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
          .invoice-meta { flex: 0 0 40%; min-width: 0; text-align: right; overflow-wrap: anywhere; word-break: break-word; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; box-sizing: border-box; }
          .table th, .table td { border: 2px solid black; padding: 10px; text-align: left; }
          .table th { background-color: #f4f4f4; }
          .print-footer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; background: #ffffff; border-top: 1px solid #ddd; height: var(--footer-h); box-sizing: border-box; overflow: hidden; }
          .print-footer .fixed-inner { max-width: 800px; height: 100%; margin: 0 auto; padding: 0 20px; box-sizing: border-box; text-align: center; display: flex; align-items: center; justify-content: center; }
          .footer { color: black; text-align: center; }
          .footer .thank-you { font-weight: bold; margin: 0; }
          .totals-wrapper { position: relative; min-height: 210px; margin-top: 10px; padding: 0 10px; }
          .notes-box {
            margin-top: 18px;
            border: 2px solid #000000;
            padding: 10px 12px;
            box-sizing: border-box;
            width: 100%;
          }
          .notes-box h3 {
            margin: 0 0 8px;
            font-size: 16px;
          }
          .notes-box ul {
            margin: 0;
            padding-left: 18px;
          }
          .notes-box li {
            display: block;
            margin: 4px 0;
            line-height: 1.4;
            white-space: normal;
          }
          .totals-table { position: absolute; top: 0; right: 10px; width: 28%; border-collapse: collapse; table-layout: fixed; font-size: 16px; margin: 0; }
          .totals-table td { padding: 6px 6px; border: 1px solid white; text-align: left; }
          .totals-table .label { width: 55%; background-color: #f9f9f9; text-align: left; font-weight: bold; }
          .totals-table .value { width: 45%; text-align: right; font-weight: bold; color: #000; }
          .totals-table .total-row { font-weight: bold; }
          .totals-table .due-row { font-weight: bold; }
          .left-logos { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 25px; width: auto; }
          .logo-container { flex: 1; text-align: left; }
          .logo-container img { width: 120%; height: 100px; }
          .logo-container-1 img { width: 120%; height: 100px; }
          .table tr, .client-info, .totals-wrapper { break-inside: avoid; page-break-inside: avoid; }
          .page-layout { width: 100%; border-collapse: collapse; }
          .page-layout > thead > tr > td, .page-layout > tbody > tr > td, .page-layout > tfoot > tr > td { padding: 0; border: none; }
          .page-layout > thead { display: table-header-group; }
          .page-layout > tfoot { display: table-footer-group; }
          .header-space { height: calc(var(--header-h) + 6px); }
          .footer-space { height: calc(var(--footer-h) + 8px); }
          @page {
            size: A4;
            margin: 0 0 12mm 0;
            @bottom-center { content: "Page " counter(page) " of " counter(pages); font-family: Arial, sans-serif; font-size: 11px; color: #444; vertical-align: middle; }
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { color: #fff !important; }
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
                <p >Powering the Future with Sustainable Solutions</p>
                <p style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin: 5px 0;">
                  <span><strong>🌐</strong> www.ecovoltex.co.uk</span>
                  <span style="display:inline-block;">|</span>
                  <span><strong>✉</strong> info@ecovoltex.co.uk</span>
                  <span style="display:inline-block;">|</span>
                  <span><strong>☏</strong> +44 7930 558824</span>
                </p>
                <p>${
                  new Date(invoice.createdAt) < new Date("2025-07-01")
                    ? "9a Oak Road Romford RM3 0PH"
                    : "5-7 Vine Street, Uxbridge London, UB81QE, United Kingdom"
                }</p>
              </div>
              <div class="header-logo">
                <img src="${logo}" alt="Eco Voltex Logo" class="logo" />
              </div>
            </div>
          </div>
        </div>

        <div class="invoice-container">
          <table class="page-layout">
            <thead><tr><td><div class="header-space"></div></td></tr></thead>
            <tfoot><tr><td><div class="footer-space"></div></td></tr></tfoot>
            <tbody><tr><td>
          <p><strong>Issue to</strong></p>
          <div class="client-info">
            <div class="client-details">
              <p><strong>Name:</strong> ${invoice.clientName}</p>
              ${
                invoice.clientPhone
                  ? `<p>${
                      invoice.clientPhone.includes("@")
                        ? `<strong>Email:</strong> ${invoice.clientPhone}`
                        : `<strong>Phone:</strong> ${invoice.clientPhone}`
                    }
                        </p>`
                  : ""
              }
              <p><strong>Address:</strong> ${invoice.clientAddress || "Address not provided"} ${invoice.postCode}</p>
              ${
                invoice.siteAddress || invoice.sitePostCode
                  ? `<div style="margin-top: 10px;">
                      ${invoice.siteAddress ? `<p><strong>Site Address:</strong> ${invoice.siteAddress} ${invoice.sitePostCode}</p>` : ""}
                    </div>`
                  : ""
              }
              
            </div>
            <div class="invoice-meta">
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
          <p><strong>Payment Details</strong></p>
          <div class="payment-section">
            <div class="payment-details">
              <p><strong>Bank Name:</strong> ${invoice.bankName || "Barclays Bank"}</p>
              <p><strong>Account Name:</strong> ${invoice.accountName || "Eco Voltex Ltd"}</p>
              <p><strong>Account Number:</strong> ${invoice.accountNumber || "00347566"}</p>
              <p><strong>Sort Code:</strong> ${invoice.sortCode || "20-19-97"}</p>
            </div>
          </div>

          <p><strong>Services</strong></p>
          <div class="invoice-details">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th>
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
                <tr>
                  <td colspan="4" style="text-align:right; font-weight:bold;">Service Subtotal</td>
                  <td style="font-weight:bold;">£${serviceSubtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          ${
            invoice.hasMaterial &&
            Array.isArray(invoice.materials) &&
            invoice.materials.length > 0
              ? `
          <p><strong>Materials</strong></p>
          <div class="invoice-details">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.materials
                  .map(
                    (material, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><div style="white-space: pre-wrap;">${material.name || ""}</div></td>
                    <td>£${(Number(material.price) || 0).toFixed(2)}</td>
                    <td>${material.quantity || 0}</td>
                    <td>£${(
                      Number(material.quantity) * Number(material.price) || 0
                    ).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr>
                  <td colspan="4" style="text-align:right; font-weight:bold;">Material Subtotal</td>
                  <td style="font-weight:bold;">£${materialSubtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>`
              : ""
          }
          
          <div class="totals-wrapper">
            <div class="left-logos">
              <div class="logo-container-1">
                <img src="${certificateLogo}" alt="Eco Voltex Certificate" class="logo" />
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
                ${
                  invoice.discount > 0
                    ? `<tr>
                        <td class="label">Discount</td>
                        <td class="value">£${invoice.discount.toFixed(2)}</td>
                      </tr>`
                    : ""
                }
                <tr>
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
          <p><strong>Notes</strong></p>
          ${
            visibleNotes.length
              ? `
          <div class="notes-box">
            <ul>
              ${visibleNotes
                .map(
                  (note) => `
                <li>${note}</li>
              `,
                )
                .join("")}
            </ul>
          </div>
          `
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
        <script>
          (function () {
            // Returns true when the whole invoice fits on a single page.
            // Measured with a narrow width and the shortest common page height (Letter, 11in),
            // so when in doubt it says "more than one page" and the page numbers stay visible.
            function fitsOnOnePage() {
              var root = document.documentElement;
              var oldWidth = root.style.width;
              root.style.width = "720px";
              var probe = document.createElement("div");
              probe.style.cssText = "position:absolute;visibility:hidden;width:1px;height:11in;";
              document.body.appendChild(probe);
              var pageHeight = probe.getBoundingClientRect().height;
              var contentHeight = document.querySelector(".page-layout").getBoundingClientRect().height;
              document.body.removeChild(probe);
              root.style.width = oldWidth;
              return contentHeight <= pageHeight - 2;
            }
            function applyPageNumbers() {
              if (fitsOnOnePage()) {
                var style = document.createElement("style");
                style.textContent = "@page { margin: 0; @bottom-center { content: none; } }";
                document.head.appendChild(style);
              }
            }
            if (document.readyState === "complete") applyPageNumbers();
            else window.addEventListener("load", applyPageNumbers);
          })();
        </script>
      </body>
      </html>
    `;
};
