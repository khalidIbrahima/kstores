const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;

const normalizeOrderItems = (order = {}) => {
  const items = order?.order_items || order?.items || [];
  return items.map((item) => {
    const product = item.products || {};
    const price = Number(item.price || product.price || 0);
    const quantity = Number(item.quantity || 0);
    const discount = Number(item.discount || 0);

    return {
      name: product.name || item.product_name || 'Produit',
      quantity,
      price,
      discount,
      total: price * quantity - discount,
    };
  });
};

const renderAddress = (address = {}) =>
  [address.address, address.city, address.state, address.zip_code]
    .filter(Boolean)
    .join(', ');

export const generateInvoiceHtml = (order, options = {}) => {
  const {
    logoUrl = '',
    brand = 'Kapital Stores',
    contactEmail = 'support@kapital-stores.shop',
    contactPhone = '+221 77 240 50 63',
    includePrintButton = true,
  } = options;

  const invoiceNumber = order?.reference || order?.id || '—';
  const createdAt = order?.created_at ? new Date(order.created_at) : new Date();
  const formattedDate = createdAt.toLocaleDateString('fr-FR');
  const invoiceItems = normalizeOrderItems(order);
  const customerName = order?.shipping_address?.name || 'Client';
  const customerEmail = order?.shipping_address?.email || '';
  const customerPhone = order?.shipping_address?.phone || '';
  const customerAddress = renderAddress(order?.shipping_address);

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount =
    invoiceItems.reduce((sum, item) => sum + Number(item.discount || 0), 0) +
    Number(order?.total_discount || 0);
  const shippingCost = Number(order?.shipping_cost || order?.shipping || 0);
  const totalAmount =
    Number(
      order?.total ??
        order?.total_amount ??
        order?.TotalAmount ??
        order?.totalAmount ??
        subtotal - totalDiscount + shippingCost
    ) || 0;

  const itemsRows = invoiceItems.length
    ? invoiceItems
        .map(
          (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${item.discount ? `-${formatCurrency(item.discount)}` : '—'}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>`
        )
        .join('')
    : `<tr><td colspan="5" style="text-align:center; padding:16px; color:#8f9bb3;">Aucun article enregistré</td></tr>`;

  return `
    <html lang="fr">
      <head>
        <title>Facture ${invoiceNumber}</title>
        <meta charset="utf-8" />
        <style>
          :root {
            color-scheme: light;
          }
          body {
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            background: #f3f5f9;
            padding: 16px;
            margin: 0;
            color: #1f2933;
          }
          .invoice-container {
            background: #ffffff;
            max-width: 780px;
            margin: 0 auto;
            border-radius: 14px;
            box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
            padding: 32px 28px 36px 28px;
          }
          .invoice-header {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 18px;
            padding-bottom: 18px;
            border-bottom: 1px solid #dbe2ef;
          }
          .header-block {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .header-title {
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #0f172a;
          }
          .header-subtitle {
            font-size: 0.95rem;
            color: #475569;
          }
          .header-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.9rem;
            color: #1f2937;
          }
          .header-list strong {
            font-weight: 600;
            color: #0f172a;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 22px 0 26px;
          }
          .info-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
          }
          .info-card h3 {
            margin: 0 0 4px 0;
            font-size: 0.9rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: #334155;
          }
          .info-card p {
            margin: 2px 0;
            font-size: 0.9rem;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border-radius: 10px;
            overflow: hidden;
          }
          thead {
            background: #1d4ed8;
            color: #ffffff;
          }
          th, td {
            padding: 12px 10px;
            text-align: left;
            font-size: 0.9rem;
          }
          th {
            font-weight: 600;
            letter-spacing: 0.03em;
          }
          tbody tr:nth-child(odd) {
            background: #f9fbff;
          }
          tbody tr:nth-child(even) {
            background: #ffffff;
          }
          tbody tr:hover {
            background: #e7f0ff;
          }
          tbody td {
            color: #1f2937;
            font-weight: 500;
          }
          tfoot td {
            padding-top: 18px;
            font-size: 1rem;
          }
          .totals {
            margin-top: 24px;
            display: flex;
            justify-content: flex-end;
          }
          .totals table {
            width: 250px;
          }
          .totals td {
            padding: 6px 0;
            font-size: 0.9rem;
          }
          .totals td:first-child {
            color: #64748b;
          }
          .totals td:last-child {
            text-align: right;
            color: #1f2937;
            font-weight: 600;
          }
          .totals .grand-total td:last-child {
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 700;
          }
          .footer {
            margin-top: 28px;
            border-top: 1px solid #e2e8f0;
            padding-top: 14px;
            font-size: 0.85rem;
            color: #64748b;
            text-align: center;
          }
          .print-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 28px auto 0 auto;
            padding: 9px 22px;
            background: #1d4ed8;
            color: #ffffff;
            font-size: 0.95rem;
            font-weight: 600;
            border: none;
            border-radius: 999px;
            cursor: pointer;
            box-shadow: 0 6px 18px rgba(29, 78, 216, 0.22);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }
          .print-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(29, 78, 216, 0.26);
          }
          @media (max-width: 600px) {
            body {
              padding: 12px;
            }
            .invoice-container {
              padding: 20px 16px 26px;
            }
            .invoice-header {
              grid-template-columns: 1fr;
              gap: 14px;
            }
            .info-grid {
              grid-template-columns: 1fr;
            }
            table {
              font-size: 0.85rem;
            }
            th, td {
              padding: 9px 7px;
            }
            .totals table {
              width: 100%;
            }
            .print-btn {
              width: 100%;
              justify-content: center;
            }
            .print-btn {
              width: 100%;
              justify-content: center;
            }
          }
          @media print {
            @page {
              size: A4;
              margin: 12mm 8mm;
            }
            body {
              background: transparent;
              padding: 0;
            }
            .invoice-container {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
              padding: 16mm 12mm;
            }
            .totals {
              margin-top: 18px;
            }
            table, tr, td, th {
              page-break-inside: avoid;
            }
            section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <header class="invoice-header">
            <div class="header-block">
              <span class="header-title">Facture</span>
              <span class="header-subtitle">${brand}</span>
            </div>
            <div class="header-block">
              <div class="header-list">
                <div><strong>Facture n° :</strong> ${invoiceNumber}</div>
                <div><strong>Date :</strong> ${formattedDate}</div>
              </div>
            </div>
            <div class="header-block">
              <div class="header-list">
                <div><strong>Contact :</strong> ${contactEmail}</div>
                ${contactPhone ? `<div><strong>Téléphone :</strong> ${contactPhone}</div>` : ''}
              </div>
            </div>
          </header>

          <section class="info-grid">
            <div class="info-card">
              <h3>Client</h3>
              <p>${customerName}</p>
              ${customerEmail ? `<p>${customerEmail}</p>` : ''}
              ${customerPhone ? `<p>${customerPhone}</p>` : ''}
              ${customerAddress ? `<p>${customerAddress}</p>` : ''}
            </div>
            <div class="info-card">
              <h3>Vendeur</h3>
              <p>${brand}</p>
              <p>${contactEmail}</p>
              <p>${contactPhone}</p>
            </div>
          </section>

          <section>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Remise</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </section>

          <section class="totals">
            <table>
              <tbody>
                <tr>
                  <td>Sous-total</td>
                  <td>${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td>Remises</td>
                  <td>${totalDiscount ? `-${formatCurrency(totalDiscount)}` : '—'}</td>
                </tr>
                <tr>
                  <td>Livraison</td>
                  <td>${shippingCost ? formatCurrency(shippingCost) : 'Offert'}</td>
                </tr>
                <tr class="grand-total">
                  <td>Total à payer</td>
                  <td>${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer class="footer">
            Merci pour votre confiance. Pour toute question concernant cette facture, contactez-nous à ${contactEmail}.
          </footer>

          ${
            includePrintButton
              ? `<button class="print-btn" onclick="window.print()">
                  Télécharger / Imprimer
                </button>`
              : ''
          }
        </div>
      </body>
    </html>
  `;
};

export const generateInvoiceText = (order, options = {}) => {
  const {
    brand = 'Kapital Stores',
    contactEmail = 'support@kapital-stores.shop',
    contactPhone = '+221 77 240 50 63',
  } = options;

  const invoiceNumber = order?.reference || order?.id || '—';
  const createdAt = order?.created_at ? new Date(order.created_at) : new Date();
  const formattedDate = createdAt.toLocaleDateString('fr-FR');
  const invoiceItems = normalizeOrderItems(order);
  const customerName = order?.shipping_address?.name || 'Client';
  const customerAddress = renderAddress(order?.shipping_address);

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount =
    invoiceItems.reduce((sum, item) => sum + Number(item.discount || 0), 0) +
    Number(order?.total_discount || 0);
  const shippingCost = Number(order?.shipping_cost || order?.shipping || 0);
  const totalAmount =
    Number(
      order?.total ??
        order?.total_amount ??
        order?.TotalAmount ??
        order?.totalAmount ??
        subtotal - totalDiscount + shippingCost
    ) || 0;

  const itemsText = invoiceItems.length
    ? invoiceItems
        .map(
          (item) =>
            `- ${item.name} x${item.quantity} — ${formatCurrency(item.price)} (${formatCurrency(
              item.total
            )} TTC)`
        )
        .join('\n')
    : 'Aucun article pour cette commande.';

  return [
    `${brand} - Facture`,
    `Facture n° : ${invoiceNumber}`,
    `Date : ${formattedDate}`,
    '',
    `Client : ${customerName}`,
    customerAddress ? `Adresse : ${customerAddress}` : null,
    '',
    'Articles :',
    itemsText,
    '',
    `Sous-total : ${formatCurrency(subtotal)}`,
    `Remises : ${totalDiscount ? `-${formatCurrency(totalDiscount)}` : '—'}`,
    `Livraison : ${shippingCost ? formatCurrency(shippingCost) : 'Offert'}`,
    `Total : ${formatCurrency(totalAmount)}`,
    '',
    `Contact : ${contactEmail} | ${contactPhone}`,
  ]
    .filter(Boolean)
    .join('\n');
};
