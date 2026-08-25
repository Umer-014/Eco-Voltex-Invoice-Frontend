import logo from "../assets/logo.jpg";

const calculateTotalBeforeDiscount = (totalPrice, discount) => {
  const newTotal = totalPrice + (discount || 0);
  return newTotal.toFixed(2);
};

export const getInvoiceHtml = (invoice, forPdf = false) => {
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