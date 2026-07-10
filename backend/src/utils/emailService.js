const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM_NAME = process.env.FROM_NAME || 'GMD Créance';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gmd-creance-frontend.onrender.com';
const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('fr-FR');
const header = (bgColor, accentColor, subtitle = 'Plateforme B2B Officielle') => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
    <div style="background: linear-gradient(135deg, ${bgColor}); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">GMD Créance</h1>
      <p style="margin: 6px 0 0; color: ${accentColor}; font-size: 13px;">${subtitle}</p>
    </div>
    <div style="padding: 28px 28px;">
`;
const footer = () => `
    </div>
    <div style="padding: 14px 28px; border-top: 1px solid #1f1f1f; text-align: center;">
      <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} GMD - Groupe Multiservices Dahoué. Tous droits réservés.</p>
      <p style="margin: 4px 0 0; color: #52525b; font-size: 11px;"><a href="${FRONTEND_URL}" style="color: #71717a;">Accéder à la plateforme</a></p>
    </div>
  </div>
`;
const send = (to, subject, html) => transporter.sendMail({ from, to, subject, html });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Création de compte
// ─────────────────────────────────────────────────────────────────────────────
async function sendAccountCreatedEmail({ to, denominationSociale }) {
  const html = header('#7f1d1d, #991b1b', '#fca5a5') + `
    <h2 style="color: #f87171; font-size: 18px;">Dossier reçu avec succès ✅</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre demande d'ouverture de <strong style="color: #fbbf24;">compte Gold B2B GMD</strong> a bien été reçue. Votre dossier est en cours d'examen par notre équipe.
    </p>
    <div style="background: #fbbf2415; border: 1px solid #f59e0b40; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #fbbf24; font-size: 13px; font-weight: 700;">⏱️ Délai de traitement : <span style="color: #fff;">48 heures ouvrables</span></p>
    </div>
    <p style="color: #71717a; font-size: 12px;">Pour toute question : <a href="mailto:${FROM_EMAIL}" style="color: #f87171;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '✅ Votre dossier GMD B2B a été reçu', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. KYC Approuvé
// ─────────────────────────────────────────────────────────────────────────────
async function sendKycApprovedEmail({ to, denominationSociale }) {
  const html = header('#14532d, #166534', '#86efac') + `
    <h2 style="color: #4ade80; font-size: 18px;">🎉 Compte approuvé !</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre dossier a été <strong style="color: #4ade80;">approuvé</strong>. Votre compte Gold B2B est désormais actif. Connectez-vous pour effectuer votre premier achat.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}" style="display: inline-block; padding: 12px 28px; background: #166534; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à ma Boutique GMD →</a>
    </div>
  ` + footer();
  return send(to, '🟢 Compte Gold B2B GMD Approuvé', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. KYC Rejeté
// ─────────────────────────────────────────────────────────────────────────────
async function sendKycRejectedEmail({ to, denominationSociale }) {
  const html = header('#7f1d1d, #991b1b', '#fca5a5') + `
    <h2 style="color: #f87171; font-size: 18px;">Résultat de l'examen de conformité</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Après examen, notre équipe a <strong style="color: #f87171;">décidé de ne pas valider</strong> votre demande à ce stade. Contactez-nous pour en savoir plus.
    </p>
    <p style="color: #71717a; font-size: 12px;">Contact : <a href="mailto:${FROM_EMAIL}" style="color: #f87171;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '🔴 Dossier GMD B2B — Décision de conformité', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Commande passée / confirmée
// ─────────────────────────────────────────────────────────────────────────────
async function sendOrderConfirmedEmail({ to, denominationSociale, orderRef, totalAmount, paymentMode, acompte }) {
  const modeLabel = paymentMode === 'echelonne' ? 'Paiement échelonné (1/3 acompte)' :
                    paymentMode === 'acompte'   ? 'Acompte 50%' : 'Cash (-5%)';
  const html = header('#1e3a5f, #1d4ed8', '#93c5fd') + `
    <h2 style="color: #60a5fa; font-size: 18px;">📦 Commande confirmée !</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Votre commande a été enregistrée avec succès sur la plateforme GMD Créance.</p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Référence commande</td><td style="text-align:right; color: #fff; font-weight: 700;">${orderRef}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Montant total</td><td style="text-align:right; color: #fbbf24; font-weight: 700;">${fmt(totalAmount)} FCFA</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Mode de paiement</td><td style="text-align:right; color: #60a5fa;">${modeLabel}</td></tr>
        ${acompte ? `<tr><td style="padding: 4px 0; color: #71717a;">Acompte versé</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(acompte)} FCFA</td></tr>` : ''}
      </table>
    </div>
    <p style="color: #a1a1aa; font-size: 13px;">Notre équipe prendra contact avec vous pour organiser la livraison dans les meilleurs délais.</p>
  ` + footer();
  return send(to, `📦 Confirmation de commande — GMD Créance`, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Portefeuille activé (dépôt initial reçu)
// ─────────────────────────────────────────────────────────────────────────────
async function sendWalletActivatedEmail({ to, denominationSociale, depositAmount, creditLimit }) {
  const html = header('#4c1d95, #6d28d9', '#c4b5fd') + `
    <h2 style="color: #a78bfa; font-size: 18px;">💳 Portefeuille activé !</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre portefeuille B2B GMD vient d'être <strong style="color: #a78bfa;">activé</strong> suite à la réception de votre dépôt d'acompte.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Dépôt d'acompte versé</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(depositAmount)} FCFA</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Ligne de crédit accordée</td><td style="text-align:right; color: #fbbf24; font-weight: 700;">${fmt(creditLimit)} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #a1a1aa; font-size: 13px;">Vous pouvez désormais passer des commandes à crédit sur notre boutique.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}" style="display: inline-block; padding: 12px 28px; background: #6d28d9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à ma Boutique →</a>
    </div>
  ` + footer();
  return send(to, '💳 Votre portefeuille GMD est activé', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Paiement d'une mensualité / créance
// ─────────────────────────────────────────────────────────────────────────────
async function sendInstallmentPaidEmail({ to, denominationSociale, amount, dueDate, remaining }) {
  const html = header('#14532d, #166534', '#86efac') + `
    <h2 style="color: #4ade80; font-size: 18px;">✅ Paiement de mensualité confirmé</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Nous confirmons la réception de votre versement mensuel.</p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Montant versé</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(amount)} FCFA</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Échéance du</td><td style="text-align:right;">${dueDate}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Solde restant dû</td><td style="text-align:right; color: #fbbf24; font-weight: 700;">${fmt(remaining)} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #71717a; font-size: 12px;">Merci pour votre régularité. Contact : <a href="mailto:${FROM_EMAIL}" style="color: #4ade80;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '✅ Paiement mensualité reçu — GMD Créance', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Rappel échéance manquée / à venir
// ─────────────────────────────────────────────────────────────────────────────
async function sendPaymentReminderEmail({ to, denominationSociale, amount, dueDate, isOverdue = false }) {
  const bgColor = isOverdue ? '#7f1d1d, #991b1b' : '#78350f, #92400e';
  const accentColor = isOverdue ? '#fca5a5' : '#fcd34d';
  const titleColor = isOverdue ? '#f87171' : '#fbbf24';
  const titleText = isOverdue ? '⚠️ Mensualité en retard — Action urgente requise' : '🔔 Rappel : Échéance à venir';
  const bodyText = isOverdue
    ? `Votre mensualité du <strong style="color: #fff;">${dueDate}</strong> d'un montant de <strong style="color: #f87171;">${fmt(amount)} FCFA</strong> n'a pas encore été réglée. Des pénalités de retard de <strong style="color: #f87171;">5% par jour</strong> s'appliquent. Veuillez régulariser immédiatement.`
    : `Votre prochaine mensualité de <strong style="color: #fbbf24;">${fmt(amount)} FCFA</strong> est due le <strong style="color: #fff;">${dueDate}</strong>. Pensez à effectuer votre virement à temps pour éviter toute pénalité.`;
  const html = header(bgColor, accentColor) + `
    <h2 style="color: ${titleColor}; font-size: 18px;">${titleText}</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">${bodyText}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 28px; background: ${isOverdue ? '#991b1b' : '#92400e'}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Régler ma mensualité →</a>
    </div>
    <p style="color: #71717a; font-size: 12px;">Contact : <a href="mailto:${FROM_EMAIL}" style="color: ${titleColor};">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, isOverdue ? '⚠️ URGENT — Mensualité en retard GMD' : '🔔 Rappel échéance GMD Créance', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Devis envoyé par l'admin
// ─────────────────────────────────────────────────────────────────────────────
async function sendQuoteReadyEmail({ to, denominationSociale, requestDescription, totalAmount, quoteItems }) {
  const itemsRows = Array.isArray(quoteItems) ? quoteItems.map(item => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #2a2a2a; color: #d4d4d8;">${item.article || item.description || '—'}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #2a2a2a; text-align:center; color: #a1a1aa;">${item.quantity || 1}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #2a2a2a; text-align:right; color: #fbbf24; font-weight: 700;">${fmt(item.total || item.price || 0)} FCFA</td>
    </tr>
  `).join('') : '';
  const html = header('#1e3a5f, #1d4ed8', '#93c5fd') + `
    <h2 style="color: #60a5fa; font-size: 18px;">📋 Votre devis est prêt !</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Notre équipe a traité votre demande spéciale et votre devis est désormais disponible sur votre espace client.
    </p>
    ${requestDescription ? `<p style="color: #71717a; font-size: 13px; font-style: italic;">Demande : "${requestDescription}"</p>` : ''}
    ${itemsRows ? `
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <thead><tr style="background: #111;">
          <th style="padding: 8px; text-align:left; color: #71717a; font-weight: 600;">Article</th>
          <th style="padding: 8px; text-align:center; color: #71717a; font-weight: 600;">Qté</th>
          <th style="padding: 8px; text-align:right; color: #71717a; font-weight: 600;">Total</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
        <tfoot><tr style="background: #111;">
          <td colspan="2" style="padding: 10px 8px; font-weight: 700; color: #d4d4d8;">TOTAL DEVIS</td>
          <td style="padding: 10px 8px; text-align:right; font-weight: 800; color: #fbbf24; font-size: 15px;">${fmt(totalAmount)} FCFA</td>
        </tr></tfoot>
      </table>
    </div>
    ` : `<p style="color: #fbbf24; font-size: 15px; font-weight: 800;">Total estimé : ${fmt(totalAmount)} FCFA</p>`}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/dashboard?tab=devis" style="display: inline-block; padding: 12px 28px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Voir mon devis →</a>
    </div>
  ` + footer();
  return send(to, '📋 Votre devis GMD est disponible', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Demande de modification de profil approuvée
// ─────────────────────────────────────────────────────────────────────────────
async function sendProfileUpdateApprovedEmail({ to, denominationSociale, changes, adminNote }) {
  const changesHtml = Object.entries(changes).map(([key, value]) => `
    <tr>
      <td style="padding: 5px 8px; color: #71717a; font-size: 12px;">${key}</td>
      <td style="padding: 5px 8px; color: #fff; font-size: 12px; font-weight: 600;">${value}</td>
    </tr>
  `).join('');
  const html = header('#14532d, #166534', '#86efac') + `
    <h2 style="color: #4ade80; font-size: 18px;">✅ Modification de profil approuvée</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre demande de modification de profil a été <strong style="color: #4ade80;">approuvée et appliquée</strong> par l'administration GMD.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <p style="margin: 0; padding: 10px 12px; color: #d4d4d8; font-size: 12px; font-weight: 700; background: #111; border-bottom: 1px solid #2a2a2a;">Champs mis à jour :</p>
      <table style="width: 100%; border-collapse: collapse;">${changesHtml}</table>
    </div>
    ${adminNote ? `<div style="background: #1e3a5f20; border: 1px solid #1d4ed840; border-radius: 8px; padding: 14px; margin-bottom: 20px;"><p style="margin: 0; color: #93c5fd; font-size: 13px;"><strong>Note de l'admin :</strong> ${adminNote}</p></div>` : ''}
    <p style="color: #71717a; font-size: 12px;">Contact : <a href="mailto:${FROM_EMAIL}" style="color: #4ade80;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '✅ Modification de profil approuvée — GMD Créance', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Demande de modification de profil rejetée
// ─────────────────────────────────────────────────────────────────────────────
async function sendProfileUpdateRejectedEmail({ to, denominationSociale, adminNote }) {
  const html = header('#7f1d1d, #991b1b', '#fca5a5') + `
    <h2 style="color: #f87171; font-size: 18px;">❌ Demande de modification rejetée</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre demande de modification de profil a été <strong style="color: #f87171;">rejetée</strong> par l'administration GMD.
    </p>
    ${adminNote ? `<div style="background: #7f1d1d20; border: 1px solid #991b1b40; border-radius: 8px; padding: 14px; margin: 20px 0;"><p style="margin: 0; color: #fca5a5; font-size: 13px;"><strong>Motif :</strong> ${adminNote}</p></div>` : ''}
    <p style="color: #a1a1aa; font-size: 13px;">Vous pouvez soumettre une nouvelle demande depuis votre espace profil.</p>
    <p style="color: #71717a; font-size: 12px;">Contact : <a href="mailto:${FROM_EMAIL}" style="color: #f87171;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '❌ Demande de modification rejetée — GMD Créance', html);
}

module.exports = {
  sendAccountCreatedEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendOrderConfirmedEmail,
  sendWalletActivatedEmail,
  sendInstallmentPaidEmail,
  sendPaymentReminderEmail,
  sendQuoteReadyEmail,
  sendProfileUpdateApprovedEmail,
  sendProfileUpdateRejectedEmail,
};
