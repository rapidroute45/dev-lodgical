const GREEN = "#7d8b6a";
const GREEN_LIGHT = "#e8ebe3";
const GREY_TITLE = "#9aa3a0";
const BORDER = "#c5c9c0";
const ROW_ALT = "#f7f8f5";

function formatShortDate(iso) {
  if (!iso || !iso.includes("-")) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}/${d}/${y}`;
}

function formatMoneyPdf(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function isSectionHeader(line) {
  return line.description === "DELIVERY SERVICES";
}

function tableDateLabel(line) {
  if (line.description === "DELIVERY SERVICES" || line.description.startsWith("overtime")) {
    return line.date;
  }
  if (!line.date) return "";
  return formatShortDate(line.date);
}

function buildLineRows(lineItems) {
  let rowIndex = 0;
  return lineItems
    .map((line) => {
      const alt = rowIndex % 2 === 1 ? `background:${ROW_ALT};` : "";
      rowIndex += 1;

      if (isSectionHeader(line)) {
        return `
        <tr style="${alt}">
          <td class="cell-date">${line.date}</td>
          <td class="cell-desc section">${line.description}</td>
          <td class="cell-pay"></td>
          <td class="cell-base"></td>
          <td class="cell-total section-total">${formatMoneyPdf(0)}</td>
        </tr>`;
      }

      if (line.description === "Rural") {
        return `
        <tr style="${alt}">
          <td class="cell-date"></td>
          <td class="cell-desc">${line.description}</td>
          <td class="cell-pay"></td>
          <td class="cell-base"></td>
          <td class="cell-total">${formatMoneyPdf(0)}</td>
        </tr>`;
      }

      const showTotal = line.total > 0 ? formatMoneyPdf(line.total) : "";
      const showBase = line.routeBase > 0 ? formatMoneyPdf(line.routeBase) : "";
      const showPay = line.pay > 0 ? String(line.pay) : "";

      return `
      <tr style="${alt}">
        <td class="cell-date">${tableDateLabel(line)}</td>
        <td class="cell-desc">${line.description}</td>
        <td class="cell-pay">${showPay}</td>
        <td class="cell-base">${showBase}</td>
        <td class="cell-total">${showTotal}</td>
      </tr>`;
    })
    .join("");
}

export function buildStoreInvoiceHtml(invoice) {
  const lineRows = buildLineRows(invoice.lineItems);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #222;
        font-size: 11px;
        padding: 28px 32px 24px;
        line-height: 1.35;
      }
      .invoice-title {
        font-size: 42px;
        font-weight: 700;
        color: ${GREY_TITLE};
        letter-spacing: 3px;
        margin-bottom: 22px;
      }
      .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
      .meta-table td { vertical-align: top; padding: 2px 0; }
      .vendor-name { color: ${GREEN}; font-weight: 700; font-size: 13px; }
      .meta-right { text-align: right; width: 42%; }
      .meta-label {
        color: ${GREEN};
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .meta-value { font-size: 12px; margin-top: 2px; }
      .bill-label {
        color: ${GREEN};
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .bill-name { font-weight: 700; font-size: 12px; }
      .bill-address { font-size: 11px; margin-top: 2px; }
      .lead-block {
        margin: 16px 0 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid ${BORDER};
      }
      .lead-label {
        color: ${GREEN};
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .project-block { margin-bottom: 14px; }
      .project-label {
        color: ${GREEN};
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .project-note { font-size: 10px; color: #555; font-style: italic; }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }
      .data-table thead th {
        background: ${GREEN};
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 8px 10px;
        border: 1px solid ${GREEN};
        text-align: left;
      }
      .data-table thead th.col-pay,
      .data-table thead th.col-base,
      .data-table thead th.col-total { text-align: center; }
      .data-table tbody td {
        border: 1px solid ${BORDER};
        padding: 7px 10px;
        vertical-align: middle;
        font-size: 11px;
      }
      .cell-date { width: 14%; }
      .cell-desc { width: 46%; }
      .cell-pay { width: 10%; text-align: center; }
      .cell-base { width: 14%; text-align: center; }
      .cell-total { width: 16%; text-align: right; font-weight: 600; }
      .section { font-weight: 700; }
      .section-total { font-weight: 700; }
      .footer-wrap {
        width: 100%;
        margin-top: 18px;
        border-collapse: collapse;
      }
      .footer-wrap td { vertical-align: top; padding: 0; }
      .remarks-box {
        border: 1px solid ${BORDER};
        padding: 12px 14px;
        min-height: 110px;
        font-size: 10px;
        line-height: 1.55;
        width: 58%;
      }
      .remarks-title {
        color: ${GREEN};
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .totals-box { width: 42%; padding-left: 16px; }
      .totals-table { width: 100%; border-collapse: collapse; }
      .totals-table td {
        padding: 6px 10px;
        font-size: 11px;
        border: none;
      }
      .totals-label {
        color: ${GREEN};
        font-weight: 700;
        text-transform: uppercase;
        text-align: right;
        width: 55%;
      }
      .totals-value { text-align: right; font-weight: 600; }
      .totals-grand td {
        background: ${GREEN};
        color: #fff;
        font-weight: 800;
        font-size: 13px;
        padding: 10px;
      }
      .totals-grand .totals-label { color: #fff; }
      .thanks {
        margin-top: 28px;
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 4px;
        color: #333;
      }
      .contact {
        text-align: center;
        font-size: 10px;
        color: #666;
        margin-top: 8px;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="invoice-title">INVOICE</div>

    <table class="meta-table">
      <tr>
        <td>
          <div class="vendor-name">${invoice.vendor.name}</div>
        </td>
        <td class="meta-right">
          <div class="meta-label">Date</div>
          <div class="meta-value">${formatShortDate(invoice.invoiceDate)}</div>
        </td>
      </tr>
      <tr>
        <td></td>
        <td class="meta-right" style="padding-top:10px">
          <div class="meta-label">Invoice No.</div>
          <div class="meta-value">${invoice.invoiceNumber}</div>
        </td>
      </tr>
    </table>

    <table class="meta-table">
      <tr>
        <td style="width:58%">
          <div class="bill-label">Bill To</div>
          <div class="bill-name">${invoice.billTo.name}</div>
          <div class="bill-address">${invoice.billTo.address}</div>
        </td>
        <td class="meta-right">
          <div class="meta-label">Date Payment Due</div>
          <div class="meta-value">${formatShortDate(invoice.paymentDueDate)}</div>
        </td>
      </tr>
    </table>

    <div class="lead-block">
      <div class="lead-label">Lead Time</div>
      <div>${invoice.leadTime}</div>
    </div>

    <div class="project-block">
      <div class="project-label">Project Details</div>
      <div class="project-note">
        Provide brief overview of or any pertinent information regarding the project, if applicable.
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description of Work</th>
          <th class="col-pay">Pay</th>
          <th class="col-base">Route Base</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>

    <table class="footer-wrap">
      <tr>
        <td>
          <div class="remarks-box">
            <div class="remarks-title">Remarks / Instructions</div>
            Make checks payable to: ${invoice.vendor.checksPayableTo}<br/>
            Bank: ${invoice.vendor.bankName}<br/>
            Routing Number: ${invoice.vendor.routingNumber}<br/>
            Account Number: ${invoice.vendor.accountNumber}
          </div>
        </td>
        <td class="totals-box">
          <table class="totals-table">
            <tr>
              <td class="totals-label">Subtotal</td>
              <td class="totals-value">${formatMoneyPdf(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td class="totals-label">Tax Rate</td>
              <td class="totals-value">${invoice.taxRate.toFixed(2)}%</td>
            </tr>
            <tr>
              <td class="totals-label"></td>
              <td class="totals-value">${formatMoneyPdf(invoice.taxAmount)}</td>
            </tr>
            <tr class="totals-grand">
              <td class="totals-label">Total</td>
              <td class="totals-value">${formatMoneyPdf(invoice.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="thanks">THANK YOU</div>
    <div class="contact">For questions concerning this invoice, please contact dispatch.</div>
  </body>
</html>`;
}

export function openStoreInvoicePrint(invoice) {
  const html = buildStoreInvoiceHtml(invoice);
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to preview or print the invoice.");
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
