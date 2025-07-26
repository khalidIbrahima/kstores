// src/services/emailService.js

import { supabase } from '../lib/supabase';

// Use your deployed Supabase Edge Function endpoint
const RESEND_EDGE_FUNCTION_URL = import.meta.env.VITE_RESEND_EDGE_FUNCTION_URL;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yourdomain.com';
const DEFAULT_FROM = 'Your Store <noreply@kapital-stores.shop>';

// Helper to get the current Supabase access token
async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// Generic function to send email via Supabase Edge Function (which uses Resend)
export const sendEmail = async ({ to, subject, html, text, from }) => {
  if (!RESEND_EDGE_FUNCTION_URL) throw new Error('Resend Edge Function URL not configured');
  if (!to || !subject || (!html && !text)) throw new Error('Missing required email parameters');

  const payload = {
    from: from || DEFAULT_FROM,
    to,
    subject,
    html,
    text,
  };

  // Get the Supabase access token
  const accessToken = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(RESEND_EDGE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Failed to send email via Resend Edge Function');
  }

  return await response.json();
};

// Helper to render order items as HTML table rows with image
function renderOrderItemsTable(items) {
  if (!items || !items.length) return '<tr><td colspan="4" style="padding: 12px; color: #888; text-align: center;">Aucun article</td></tr>';
  return items.map(item => `
    <tr>
      <td style="padding: 8px 6px; border-bottom: 1px solid #f1f1f1; text-align: center; width: 48px;">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; background: #f3f3f3;" />` : `<div style='width:40px;height:40px;border-radius:6px;background:#f3f3f3;display:inline-block;'></div>`}
      </td>
      <td style="padding: 8px 8px; border-bottom: 1px solid #f1f1f1;">${item.name || item.product_name || 'Produit'}</td>
      <td style="padding: 8px 8px; border-bottom: 1px solid #f1f1f1; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 8px; border-bottom: 1px solid #f1f1f1; text-align: right;">${item.price?.toLocaleString('fr-FR') || '0'} FCFA</td>
    </tr>
  `).join('');
}

// Helper to render order items as plain text
function renderOrderItemsText(items) {
  if (!items || !items.length) return 'Aucun article';
  return items.map(item => `- ${item.name || item.product_name || 'Produit'} x${item.quantity} (${item.price?.toLocaleString('fr-FR') || '0'} FCFA)`).join('\n');
}

// Send order notification to admin
export const sendOrderEmailNotificationToAdmin = async (order) => {
  const customerName = order.shipping_address?.name || 'Client invité';
  const orderId = order.id;
  const orderDate = new Date(order.created_at).toLocaleString('fr-FR');
  const orderTotal = order.total.toLocaleString('fr-FR');
  const orderAddress = order.shipping_address?.address || 'Non fourni';
  const orderItems = order.order_items || [];

  const subject = `🛒 Nouvelle Commande #${orderId} - ${customerName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 0; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6fb; padding: 0; margin: 0;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin: 32px 0;">
              <tr>
                <td style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); padding: 32px 0 16px 0; border-radius: 12px 12px 0 0; text-align: center;">
                  <span style="font-size: 2rem; color: #fff; font-weight: bold; letter-spacing: 1px;">Kapital Stores</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px 16px 24px;">
                  <h2 style="margin: 0 0 12px 0; color: #222; font-size: 1.4rem;">Nouvelle commande reçue</h2>
                  <div style="background: #f1f5ff; border-radius: 8px; padding: 16px; margin-bottom: 18px;">
                    <div style="font-size: 1.1rem; margin-bottom: 8px;"><b>Commande #${orderId}</b></div>
                    <div>Date : <b>${orderDate}</b></div>
                    <div>Total : <b style='color:#3b82f6;'>${orderTotal} FCFA</b></div>
                  </div>
                  <div style="margin-bottom: 18px;">
                    <div style="font-weight: 500; margin-bottom: 4px;">Client :</div>
                    <div>${customerName}</div>
                    <div style="color: #666; font-size: 0.95rem;">${orderAddress}</div>
                  </div>
                  <div style="margin: 18px 0 0 0;">
                    <div style="font-weight: 500; margin-bottom: 4px;">Articles commandés :</div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 8px; background: #f9fafb; margin-top: 8px; font-size: 0.98rem;">
                      <thead>
                        <tr style="background: #e0e7ff; color: #333;">
                          <th align="center" style="padding: 8px 6px; border-radius: 8px 0 0 0;">Image</th>
                          <th align="left" style="padding: 8px 12px;">Produit</th>
                          <th align="center" style="padding: 8px 12px;">Qté</th>
                          <th align="right" style="padding: 8px 12px; border-radius: 0 8px 0 0;">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${renderOrderItemsTable(orderItems)}
                      </tbody>
                    </table>
                  </div>
                  <a href="https://kapital-stores.shop/admin/orders-page/${orderId}" style="display: inline-block; background: #667eea; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin-top: 18px;">Voir la commande</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 24px 16px 24px; color: #888; font-size: 0.95rem; text-align: center; border-radius: 0 0 12px 12px;">
                  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
                  <div>Ce message a été envoyé automatiquement par <b>Kapital Stores</b>.</div>
                  <div style="margin-top: 4px;">Merci de traiter cette commande rapidement !</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
  const text = `
    Nouvelle Commande Reçue - Kapital Stores\n\nCommande #${orderId}\nDate: ${orderDate}\nTotal: ${orderTotal} FCFA\nClient: ${customerName}\nAdresse: ${orderAddress}\n\nArticles commandés :\n${renderOrderItemsText(orderItems)}\n\nVoir la commande: https://kapitalstores.shop/admin/orders-page/${orderId}\n\nMerci de traiter cette commande rapidement !\nKapital Stores
  `;

  return sendEmail({ to: ADMIN_EMAIL, subject, html, text });
};

// Send order confirmation to customer
export const sendOrderEmailConfirmationToCustomer = async (order) => {
  const customerEmail = order.shipping_address?.email;
  if (!customerEmail) return;

  const customerName = order.shipping_address?.name || 'Cher client';
  const orderId = order.id;
  const orderTotal = order.total.toLocaleString('fr-FR');
  const orderDate = new Date(order.created_at).toLocaleString('fr-FR');
  const orderItems = order.order_items || [];

  const subject = `✅ Confirmation de commande #${orderId} - Kapital Stores`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 0; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6fb; padding: 0; margin: 0;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin: 32px 0;">
              <tr>
                <td style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); padding: 32px 0 16px 0; border-radius: 12px 12px 0 0; text-align: center;">
                  <span style="font-size: 2rem; color: #fff; font-weight: bold; letter-spacing: 1px;">Kapital Stores</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px 16px 24px;">
                  <h2 style="margin: 0 0 12px 0; color: #222; font-size: 1.4rem;">Merci pour votre commande !</h2>
                  <div style="background: #e0f2fe; border-radius: 8px; padding: 16px; margin-bottom: 18px;">
                    <div style="font-size: 1.1rem; margin-bottom: 8px;"><b>Commande #${orderId}</b></div>
                    <div>Date : <b>${orderDate}</b></div>
                    <div>Total : <b style='color:#3b82f6;'>${orderTotal} FCFA</b></div>
                  </div>
                  <div style="margin-bottom: 18px;">
                    <div style="font-weight: 500; margin-bottom: 4px;">Client :</div>
                    <div>${customerName}</div>
                  </div>
                  <div style="margin: 18px 0 0 0;">
                    <div style="font-weight: 500; margin-bottom: 4px;">Articles commandés :</div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 8px; background: #f9fafb; margin-top: 8px; font-size: 0.98rem;">
                      <thead>
                        <tr style="background: #e0e7ff; color: #333;">
                          <th align="center" style="padding: 8px 6px; border-radius: 8px 0 0 0;">Image</th>
                          <th align="left" style="padding: 8px 12px;">Produit</th>
                          <th align="center" style="padding: 8px 12px;">Qté</th>
                          <th align="right" style="padding: 8px 12px; border-radius: 0 8px 0 0;">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${renderOrderItemsTable(orderItems)}
                      </tbody>
                    </table>
                  </div>
                  <div style="margin: 18px 0 0 0;">
                    <div style="font-weight: 500; margin-bottom: 4px;">Prochaines étapes :</div>
                    <ol style="padding-left: 18px; color: #444;">
                      <li>Nous vous contacterons pour confirmer les détails</li>
                      <li>Préparation et expédition de votre commande</li>
                    </ol>
                  </div>
                  <a href="https://kapital-stores.shop/orders" style="display: inline-block; background: #667eea; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin-top: 18px;">Suivre ma commande</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 24px 16px 24px; color: #888; font-size: 0.95rem; text-align: center; border-radius: 0 0 12px 12px;">
                  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
                  <div>Merci pour votre confiance !</div>
                  <div style="margin-top: 4px;">Kapital Stores - Votre satisfaction est notre priorité</div>
                </td>
              </tr>
            </table>  
          </td>
        </tr>
      </table>
    </div>
  `;
  const text = `
    Confirmation de commande - Kapital Stores\n\nCommande #${orderId}\nDate: ${orderDate}\nTotal: ${orderTotal} FCFA\nClient: ${customerName}\n\nArticles commandés :\n${renderOrderItemsText(orderItems)}\n\nSuivre ma commande: https://kapitalstores.shop/orders/${orderId}\n\nMerci pour votre confiance !\nKapital Stores
  `;

  return sendEmail({ to: customerEmail, subject, html, text });
};

// Send order status update to customer
export const sendOrderStatusUpdateEmailToCustomer = async (order, newStatus) => {
  const customerEmail = order.shipping_address?.email;
  if (!customerEmail) return;

  const customerName = order.shipping_address?.name || 'Cher client';
  const orderId = order.id;
  let statusMessage = '';
  let emoji = '';

  switch (newStatus) {
    case 'processing':
      statusMessage = 'en cours de traitement'; emoji = '⚙️'; break;
    case 'shipped':
      statusMessage = 'expédiée'; emoji = '📦'; break;
    case 'delivered':
      statusMessage = 'livrée'; emoji = '✅'; break;
    case 'cancelled':
      statusMessage = 'annulée'; emoji = '❌'; break;
    default:
      statusMessage = newStatus; emoji = '📋';
  }

  const subject = `${emoji} Mise à jour de commande #${orderId} - Kapital Stores`;
  const html = `
    <h1>${emoji} Mise à jour de commande</h1>
    <p>Bonjour ${customerName},</p>
    <p>Votre commande #${orderId} est maintenant <b>${statusMessage}</b>.</p>
    <p>Vous pouvez suivre votre commande sur notre site web.</p>
  `;
  const text = `
    ${emoji} MISE À JOUR DE COMMANDE\nBonjour ${customerName},\nVotre commande #${orderId} est maintenant ${statusMessage}.\nVous pouvez suivre votre commande sur notre site web.
  `;

  return sendEmail({ to: customerEmail, subject, html, text });
};

// Test email configuration (sends a test email to admin)
export const testEmailConfiguration = async () => {
  const subject = '🧪 Test Email - Kapital Stores';
  const html = '<h1>Test Email</h1><p>Ceci est un test de la configuration Resend via Supabase Edge Function.</p>';
  const text = 'Ceci est un test de la configuration Resend via Supabase Edge Function.';
  try {
    await sendEmail({ to: ADMIN_EMAIL, subject, html, text });
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}; 

export const getEmailConfig = async () => {
  const { data, error } = await supabase.from('email_config').select('*').single();
  if (error) throw error;
  return data;
};

