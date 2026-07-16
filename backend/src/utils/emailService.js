const nodemailer = require('nodemailer');
const { generateReceiptPdf } = require('./pdfGenerator');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM_NAME = process.env.FROM_NAME || 'Galassy Meuble Décor';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || FROM_EMAIL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gmd-creance-frontend.onrender.com';
const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('fr-FR');
const header = (bgColor, accentColor, subtitle = 'Plateforme B2B Officielle') => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
    <div style="background: linear-gradient(135deg, ${bgColor}); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">Galassy Meuble Décor</h1>
      <p style="margin: 6px 0 0; color: ${accentColor}; font-size: 13px;">${subtitle}</p>
    </div>
    <div style="padding: 28px 28px;">
`;
const footer = () => `
    </div>
    <div style="padding: 14px 28px; border-top: 1px solid #1f1f1f; text-align: center;">
      <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} GMD - GALASSY MEUBLE DECOR. Tous droits réservés.</p>
      <p style="margin: 4px 0 0; color: #52525b; font-size: 11px;"><a href="${FRONTEND_URL}" style="color: #71717a;">Accéder à la plateforme</a></p>
    </div>
  </div>
`;
const send = (to, subject, html, attachments = []) => transporter.sendMail({ from, to, subject, html, attachments });

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
async function sendKycApprovedEmail({ to, denominationSociale, password }) {
  const html = header('#14532d, #166534', '#86efac') + `
    <h2 style="color: #4ade80; font-size: 18px;">🎉 Compte approuvé !</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre dossier a été <strong style="color: #4ade80;">approuvé</strong>. Votre compte Gold B2B est désormais actif.
    </p>
    <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 13px;">Voici vos identifiants de connexion temporaires :</p>
      <p style="margin: 8px 0 0; color: #fff; font-size: 14px; font-weight: bold;">Identifiant : <span style="color: #60a5fa; font-family: monospace;">${to.split(',')[0]}</span></p>
      <p style="margin: 4px 0 0; color: #fff; font-size: 14px; font-weight: bold;">Mot de passe : <span style="color: #34d399; font-family: monospace;">${password}</span></p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/login" style="display: inline-block; padding: 12px 28px; background: #166534; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Se connecter à ma Boutique GMD →</a>
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
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Votre commande a été enregistrée avec succès sur la plateforme Galassy Meuble Décor.</p>
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
  return send(to, `📦 Confirmation de commande — Galassy Meuble Décor`, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Portefeuille activé (dépôt initial reçu)
// ─────────────────────────────────────────────────────────────────────────────
async function sendWalletActivatedEmail({ to, denominationSociale, depositAmount, creditLimit, managerName, ifu, transactionId }) {
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
    <p style="color: #a1a1aa; font-size: 13px;">Vous trouverez ci-joint votre reçu officiel de paiement au format PDF.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}" style="display: inline-block; padding: 12px 28px; background: #6d28d9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à ma Boutique →</a>
    </div>
  ` + footer();

  let attachments = [];
  try {
    const pdfBuffer = await generateReceiptPdf({
      type: 'acompte',
      denominationSociale,
      managerName: managerName || 'Gérant',
      managerEmail: to,
      ifu: ifu || '—',
      amount: Number(depositAmount),
      transactionId: transactionId || 'SANDBOX_TX'
    });
    attachments.push({
      filename: `Recu_Activation_GMD_${transactionId || 'Acompte'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  } catch (err) {
    console.error('Error generating activation PDF:', err);
  }

  return send(to, '💳 Votre portefeuille GMD est activé', html, attachments);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Paiement d'une mensualité / créance
// ─────────────────────────────────────────────────────────────────────────────
async function sendInstallmentPaidEmail({ to, denominationSociale, amount, dueDate, remaining, managerName, ifu, transactionId, orderNumber, installmentNumber }) {
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
    <p style="color: #a1a1aa; font-size: 13px;">Vous trouverez ci-joint votre reçu de paiement PDF officiel.</p>
    <p style="color: #71717a; font-size: 12px;">Merci pour votre régularité. Contact : <a href="mailto:${FROM_EMAIL}" style="color: #4ade80;">${FROM_EMAIL}</a></p>
  ` + footer();

  let attachments = [];
  try {
    const pdfBuffer = await generateReceiptPdf({
      type: 'mensualite',
      denominationSociale,
      managerName: managerName || 'Gérant',
      managerEmail: to,
      ifu: ifu || '—',
      amount: Number(amount),
      transactionId: transactionId || 'SANDBOX_TX',
      orderNumber,
      installmentNumber,
      dueDate
    });
    attachments.push({
      filename: `Recu_Mensualite_${installmentNumber || ''}_GMD_${transactionId || 'M'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  } catch (err) {
    console.error('Error generating installment PDF:', err);
  }

  return send(to, '✅ Paiement mensualité reçu — Galassy Meuble Décor', html, attachments);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Rappels de Créances (Textes Officiels C001, C002, C003)
// ─────────────────────────────────────────────────────────────────────────────
async function sendDebtReminderEmail({ to, managerName, amount, dueDate, type, penaltyAmount = 0, totalDue = 0, soldeDu = 0 }) {
  let bgColor = '#78350f, #92400e';
  let titleColor = '#fbbf24';
  let subject = '🔔 Rappel échéance — Galassy Meuble Décor';
  let bodyText = '';

  const formattedDueDate = new Date(dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (type === 'C001') {
    bgColor = '#78350f, #92400e';
    titleColor = '#fbbf24';
    subject = '🔔 Rappel échéance — Galassy Meuble Décor';
    bodyText = `
      <p style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 12px;">${managerName}, bonjour,</p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Votre facture de créance du <strong style="color: #fff;">${formattedDueDate}</strong>, d'un montant de <strong style="color: #fbbf24;">${fmt(amount)} FCFA</strong>, sera échue le <strong style="color: #fff;">${formattedDueDate}</strong>.
      </p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Nous vous invitons à procéder au paiement en cliquant sur le lien de notre site de paiement <a href="${FRONTEND_URL}" style="color: #fbbf24; text-decoration: underline;">galassymeubledecor.shop</a> afin d'éviter des frais de pénalités de <strong style="color: #fbbf24;">05 % journaliers</strong>, voire la rupture officielle du contrat sans recours dès le 6e jour de retard, entraînant la réquisition des meubles à défaut du solde de tout compte, conformément à l'accord initial.
      </p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Rendez-vous en agence pour assistance ou autres préoccupations.
      </p>
    `;
  } else if (type === 'C002') {
    bgColor = '#7f1d1d, #991b1b';
    titleColor = '#f87171';
    subject = '⚠️ Mensualité en retard — Galassy Meuble Décor';
    bodyText = `
      <p style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 12px;">${managerName}, bonjour,</p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Votre facture de créance du <strong style="color: #fff;">${formattedDueDate}</strong>, d'un montant de <strong style="color: #f87171;">${fmt(amount)} FCFA</strong>, est échue depuis le <strong style="color: #fff;">${formattedDueDate}</strong>.
      </p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Nous vous invitons à procéder au paiement en cliquant sur le lien de notre site de paiement <a href="${FRONTEND_URL}" style="color: #f87171; text-decoration: underline;">galassymeubledecor.shop</a> afin d'éviter des frais de pénalités de <strong style="color: #f87171;">05 % journaliers</strong>, voire la rupture officielle du contrat sans recours dès le 6e jour de retard, entraînant la réquisition des meubles à défaut du solde de tout compte, conformément à l'accord initial.
      </p>
      <div style="background: #7f1d1d15; border: 1px solid #7f1d1d50; border-radius: 8px; padding: 14px; margin: 18px 0; color: #fca5a5; font-size: 13px; font-family: monospace;">
        <strong>Pénalités de retard :</strong> ${fmt(penaltyAmount)} FCFA
      </div>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Rendez-vous en agence pour assistance ou autres préoccupations.
      </p>
    `;
  } else if (type === 'C003') {
    bgColor = '#000000, #111111';
    titleColor = '#f87171';
    subject = '🚨 Rupture officielle de contrat — Galassy Meuble Décor';
    bodyText = `
      <p style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 12px;">${managerName}, bonjour,</p>
      <p style="color: #f87171; line-height: 1.7; font-size: 14px; font-weight: bold;">
        Par la présente, nous vous informons de la rupture officielle de votre contrat sans recours possible pour manquement contractuel.
      </p>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Nous vous invitons à procéder au paiement du solde de tout compte sans délai possible en cliquant sur le lien de notre site de paiement <a href="${FRONTEND_URL}" style="color: #f87171; text-decoration: underline;">galassymeubledecor.shop</a> afin d'éviter les frais de pénalités de <strong style="color: #f87171;">05 % journaliers</strong>, voire la réquisition des meubles par nos agents, conformément à l'accord contractuel.
      </p>
      <div style="background: #1f1f1f; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 18px 0; font-size: 13px; font-family: monospace; color: #e4e4e7;">
        <table style="width: 100%;">
          <tr><td>Solde dû :</td><td style="text-align: right; color: #fff;">${fmt(soldeDu)} FCFA</td></tr>
          <tr><td>Pénalités :</td><td style="text-align: right; color: #f87171;">${fmt(penaltyAmount)} FCFA</td></tr>
          <tr style="border-top: 1px solid #444;"><td style="font-weight: bold; padding-top: 6px;">Total dû :</td><td style="text-align: right; color: #34d399; font-weight: bold; font-size: 15px; padding-top: 6px;">${fmt(totalDue)} FCFA</td></tr>
        </table>
      </div>
      <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
        Rendez-vous en agence pour assistance ou autres préoccupations.
      </p>
    `;
  }

  const html = header(bgColor, titleColor, 'Service Recouvrement') + bodyText + footer();
  return send(to, subject, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.2 Notification Clôture / Fin de Contrat
// ─────────────────────────────────────────────────────────────────────────────
async function sendContractCompletedEmail({ to, denominationSociale, managerName }) {
  const html = header('#065f46, #047857', '#34d399', 'Félicitations GMD B2B') + `
    <h2 style="color: #34d399; font-size: 18px;">🎉 Solde de tout compte & Fin de contrat</h2>
    <p style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 12px;">${managerName}, bonjour,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Nous avons le plaisir de vous informer que votre dernière échéance de créance a été entièrement réglée avec succès.
    </p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Votre ligne de crédit est désormais entièrement soldée et votre contrat de crédit B2B pour cette commande s'est achevé en excellente conformité.
    </p>
    <div style="background: #065f4615; border: 1px solid #04785740; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; color: #34d399; font-weight: bold; font-size: 14px;">
      ✓ COMPTE EN EXCELLENTE CONFORMITÉ
    </div>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Toute l'équipe de <strong style="color: #fff;">Galassy Meuble Décor</strong> vous remercie chaleureusement pour votre fidélité et votre régularité exemplaire. Nous serons honorés de vous accompagner sur vos futurs projets d'ameublement professionnel.
    </p>
    <p style="color: #71717a; font-size: 12px;">Pour toute nouvelle demande : <a href="mailto:${FROM_EMAIL}" style="color: #34d399;">${FROM_EMAIL}</a></p>
  ` + footer();
  return send(to, '🎉 Fin de contrat de créance — Galassy Meuble Décor', html);
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
  return send(to, '✅ Modification de profil approuvée — Galassy Meuble Décor', html);
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
  return send(to, '❌ Demande de modification rejetée — Galassy Meuble Décor', html);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Admin Notifications ──────────────────────────────────────────────────────
async function sendAdminNewRegistrationEmail({ company }) {
  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 18px;">📢 Nouveau dossier d'inscription reçu</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Une nouvelle entreprise vient de soumettre ses pièces justificatives sur la plateforme B2B.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Entreprise</td><td style="text-align:right; color: #fff; font-weight: 700;">${company.denomination_sociale}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Email</td><td style="text-align:right; color: #fff;">${company.email}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Téléphone</td><td style="text-align:right; color: #fff;">${company.phone}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">IFU</td><td style="text-align:right; color: #fbbf24;">${company.ifu_number}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">RCCM</td><td style="text-align:right; color: #fbbf24;">${company.rccm_number}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/admin" style="display: inline-block; padding: 12px 28px; background: #374151; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à la Console Admin GMD →</a>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `📢 GMD B2B : Inscription de ${company.denomination_sociale} en attente`, html);
}

async function sendAdminNewOrderEmail({ company, orderRef, totalAmount, items }) {
  const acomptePortion = totalAmount / 3;
  const creditPortion = (totalAmount * 2) / 3;

  let itemsHtml = '';
  if (items && Array.isArray(items)) {
    itemsHtml = items.map(item => {
      const name = item.product ? item.product.name : (item.name || 'Produit');
      const qty = item.quantity;
      const price = Number(item.price);
      const motif = item.motif || 'Standard';
      const imageUrl = item.product ? item.product.image_url : null;
      return `
        <tr style="border-bottom: 1px solid #2a2a2a; vertical-align: top;">
          <td style="padding: 12px 8px 12px 0; width: 64px;">
            ${imageUrl
              ? `<img src="${imageUrl}" alt="${name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #333;" />`
              : `<div style="width:60px;height:60px;background:#1a1a1a;border-radius:8px;border:1px solid #333;display:flex;align-items:center;justify-content:center;color:#555;font-size:10px;text-align:center;">Pas de<br/>photo</div>`
            }
          </td>
          <td style="padding: 12px 8px; color: #fff; font-size: 13px;">
            <strong>${name}</strong><br/>
            <span style="font-size: 11px; color: #a78bfa; background: #1a1028; border-radius:4px; padding: 2px 6px; display:inline-block; margin-top:4px;">🎨 Motif : ${motif}</span><br/>
            <span style="font-size: 11px; color: #71717a; margin-top:4px; display:inline-block;">Prix unitaire : ${fmt(price)} FCFA</span>
          </td>
          <td style="padding: 12px 4px; text-align: center; color: #d4d4d8; font-size: 13px; white-space:nowrap;">${qty} unité${qty > 1 ? 's' : ''}</td>
          <td style="padding: 12px 0 12px 8px; text-align: right; color: #fbbf24; font-weight: 700; font-size: 13px; white-space:nowrap;">${fmt(price * qty)} FCFA</td>
        </tr>
      `;
    }).join('');
  }

  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 20px; margin: 0 0 8px 0;">🛒 Nouvelle commande reçue</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px; margin: 0 0 20px 0;">
      Une nouvelle commande à crédit a été validée. Référence : <strong style="color:#fff;">${orderRef}</strong>
    </p>

    <!-- Infos Client -->
    <div style="background: #0f172a; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px;">👤 Client</p>
      <table style="width: 100%; font-size: 12px; color: #d4d4d8; border-collapse: collapse;">
        <tr><td style="padding: 3px 0; color: #71717a; width: 40%;">Entreprise</td><td style="font-weight:700; color:#fff;">${company.denomination_sociale}</td></tr>
        <tr><td style="padding: 3px 0; color: #71717a;">Responsable</td><td>${company.manager_name || '—'}</td></tr>
        <tr><td style="padding: 3px 0; color: #71717a;">Téléphone</td><td>${company.manager_phone || '—'}</td></tr>
        <tr><td style="padding: 3px 0; color: #71717a;">Email</td><td>${company.email || '—'}</td></tr>
        <tr><td style="padding: 3px 0; color: #71717a;">N° IFU</td><td>${company.ifu_number || '—'}</td></tr>
      </table>
    </div>

    <!-- Articles commandés -->
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 18px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px;">🛍️ Articles commandés</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #333; color: #71717a; text-align: left; font-size: 11px; text-transform: uppercase;">
            <th style="padding-bottom: 8px; width: 64px;"></th>
            <th style="padding-bottom: 8px;">Désignation / Motif</th>
            <th style="padding-bottom: 8px; text-align: center;">Qté</th>
            <th style="padding-bottom: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="4" style="padding: 12px 0; text-align: center; color: #71717a;">Aucun article</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Récapitulatif financier -->
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 18px; margin: 0 0 24px 0;">
      <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 700; color: #4ade80; text-transform: uppercase; letter-spacing: 1px;">💰 Récapitulatif Financier</p>
      <table style="width: 100%; font-size: 13px; color: #d4d4d8; border-collapse: collapse;">
        <tr><td style="padding: 5px 0; color: #71717a;">Montant total de la commande</td><td style="text-align:right; color: #fbbf24; font-weight: 700; font-size: 15px;">${fmt(totalAmount)} FCFA</td></tr>
        <tr><td style="padding: 5px 0; color: #71717a;">Acompte versé (1/3)</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(acomptePortion)} FCFA</td></tr>
        <tr><td style="padding: 5px 0; color: #71717a;">Crédit accordé (2/3)</td><td style="text-align:right; color: #a78bfa; font-weight: 700;">${fmt(creditPortion)} FCFA</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/admin" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #374151, #1f2937); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; border: 1px solid #4b5563;">Consulter sur l'administration →</a>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `🛒 GMD B2B : Nouvelle commande de ${company.denomination_sociale} — ${orderRef}`, html);
}


async function sendAdminWalletActivatedEmail({ company, depositAmount, creditLimit }) {
  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 18px;">💳 Activation de portefeuille confirmée</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Le portefeuille de l'entreprise <strong>${company.denomination_sociale}</strong> a été activé avec succès.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Dépôt initial</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(depositAmount)} FCFA</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Ligne de crédit débloquée</td><td style="text-align:right; color: #fbbf24; font-weight: 700;">${fmt(creditLimit)} FCFA</td></tr>
      </table>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `💳 GMD B2B : Portefeuille activé pour ${company.denomination_sociale}`, html);
}

async function sendAdminInstallmentPaidEmail({ company, amount, orderRef, installmentNumber }) {
  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 18px;">💰 Remboursement de mensualité reçu</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Un paiement a été effectué pour une échéance de crédit.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
        <tr><td style="padding: 4px 0; color: #71717a;">Entreprise</td><td style="text-align:right; color: #fff;">${company.denomination_sociale}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Commande</td><td style="text-align:right; color: #fff;">${orderRef}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Mensualité N°</td><td style="text-align:right; color: #fff;">${installmentNumber}</td></tr>
        <tr><td style="padding: 4px 0; color: #71717a;">Montant remboursé</td><td style="text-align:right; color: #4ade80; font-weight: 700;">${fmt(amount)} FCFA</td></tr>
      </table>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `💰 GMD B2B : Mensualité réglée par ${company.denomination_sociale}`, html);
}

async function sendAdminProfileUpdateSubmittedEmail({ company, changes }) {
  const changesHtml = Object.entries(changes).map(([key, value]) => `
    <tr>
      <td style="padding: 5px 8px; color: #71717a; font-size: 12px;">${key}</td>
      <td style="padding: 5px 8px; color: #fff; font-size: 12px; font-weight: 600;">${value}</td>
    </tr>
  `).join('');
  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 18px;">✏️ Nouvelle demande de modification de profil</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      L'entreprise <strong>${company.denomination_sociale}</strong> a soumis une demande de modification de ses informations de profil.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <p style="margin: 0; padding: 10px 12px; color: #d4d4d8; font-size: 12px; font-weight: 700; background: #111; border-bottom: 1px solid #2a2a2a;">Modifications demandées :</p>
      <table style="width: 100%; border-collapse: collapse;">${changesHtml}</table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/admin" style="display: inline-block; padding: 12px 28px; background: #374151; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Traiter la demande sur la console admin →</a>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `✏️ GMD B2B : Demande de modification de profil - ${company.denomination_sociale}`, html);
}

async function sendAdminNewSpecialRequestEmail({ company, requestDescription, quantity }) {
  const html = header('#4b5563, #374151', '#9ca3af', 'Notification Administrateur') + `
    <h2 style="color: #fbbf24; font-size: 18px;">📋 Nouvelle demande de devis sur-mesure</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      L'entreprise <strong>${company.denomination_sociale}</strong> vient de soumettre une nouvelle demande de devis sur-mesure.
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0; color: #d4d4d8; font-size: 13px;">
      <p style="margin: 0 0 10px 0;"><strong>Description du besoin :</strong></p>
      <p style="color: #fff; font-style: italic; margin: 0 0 16px 0;">"${requestDescription}"</p>
      <p style="margin: 0;"><strong>Quantité demandée :</strong> ${quantity} article(s)</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/admin" style="display: inline-block; padding: 12px 28px; background: #374151; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à la console pour estimer le devis →</a>
    </div>
  ` + footer();
  return send(ADMIN_EMAIL, `📋 GMD B2B : Nouvelle demande de devis de ${company.denomination_sociale}`, html);
}

async function sendOtpEmail({ to, otpCode }) {
  const html = header('#1e3b5f, #1d4ed8', '#93c5fd', 'Sécurité de Connexion') + `
    <h2 style="color: #60a5fa; font-size: 18px;">🔑 Votre code de vérification (OTP)</h2>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">Bonjour,</p>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
      Pour finaliser votre connexion à la plateforme B2B Galassy Meuble Décor, veuillez saisir le code de vérification suivant :
    </p>
    <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <span style="color: #34d399; font-size: 28px; font-weight: 900; font-family: monospace; letter-spacing: 6px;">${otpCode}</span>
    </div>
    <p style="color: #a1a1aa; line-height: 1.7; font-size: 13px;">
      Ce code est confidentiel et expirera dans <strong style="color: #fff;">10 minutes</strong>. Ne le partagez jamais.
    </p>
    <p style="color: #71717a; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
  ` + footer();
  return send(to, '🔑 Votre code OTP de connexion — Galassy Meuble Décor', html);
}

module.exports = {
  sendAccountCreatedEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendOrderConfirmedEmail,
  sendWalletActivatedEmail,
  sendInstallmentPaidEmail,
  sendDebtReminderEmail,
  sendContractCompletedEmail,
  sendQuoteReadyEmail,
  sendProfileUpdateApprovedEmail,
  sendProfileUpdateRejectedEmail,
  sendAdminNewRegistrationEmail,
  sendAdminNewOrderEmail,
  sendAdminWalletActivatedEmail,
  sendAdminInstallmentPaidEmail,
  sendAdminProfileUpdateSubmittedEmail,
  sendAdminNewSpecialRequestEmail,
  sendOtpEmail,
};
