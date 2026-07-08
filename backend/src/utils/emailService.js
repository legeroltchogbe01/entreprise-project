const nodemailer = require('nodemailer');

/**
 * Transporter Nodemailer configuré pour Brevo SMTP (smtp-relay.brevo.com).
 * Les credentials sont chargés depuis les variables d'environnement.
 * SMTP_USER  = login technique Brevo (ex: b1388b001@smtp-brevo.com)
 * SMTP_FROM  = email affiché aux destinataires (ex: galassymeubledecor@gmail.com)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM_NAME = process.env.FROM_NAME || 'GMD - Groupe Multiservices Dahoué';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;
const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;

// ────────────────────────────────────────────────
// 1. Email de confirmation de création de compte
// ────────────────────────────────────────────────
async function sendAccountCreatedEmail({ to, denominationSociale }) {
  const subject = '✅ Votre dossier GMD B2B a été reçu avec succès';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
      <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">GMD Créance</h1>
        <p style="margin: 6px 0 0; color: #fca5a5; font-size: 13px;">Plateforme B2B Officielle</p>
      </div>
      <div style="padding: 32px 28px;">
        <h2 style="color: #f87171; font-size: 18px; margin-bottom: 8px;">Dossier reçu avec succès ✅</h2>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,
        </p>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Nous avons bien reçu votre demande d'ouverture de <strong style="color: #fbbf24;">compte Gold B2B GMD</strong>. Votre dossier de conformité est désormais en cours d'examen par notre équipe administrative.
        </p>
        <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <p style="margin: 0 0 8px; color: #d4d4d8; font-size: 13px; font-weight: 700;">📋 Ce que nous allons vérifier :</p>
          <ul style="color: #a1a1aa; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">
            <li>Votre Identifiant Fiscal Unique (IFU)</li>
            <li>Votre Registre de Commerce et du Crédit Mobilier (RCCM)</li>
            <li>Les pièces d'identité du gérant et de l'avaliseur</li>
            <li>Votre ancienneté en tant que client GMD</li>
          </ul>
        </div>
        <div style="background: #fbbf2415; border: 1px solid #f59e0b40; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #fbbf24; font-size: 13px; font-weight: 700;">⏱️ Délai de traitement : <span style="color: #fff;">48 heures ouvrables</span></p>
          <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 12px;">Vous recevrez un email de notre part dès que la décision aura été prise.</p>
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.6;">
          Si vous avez des questions, contactez notre équipe à <a href="mailto:${FROM_EMAIL}" style="color: #f87171;">${FROM_EMAIL}</a>.
        </p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #1f1f1f; text-align: center;">
        <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} GMD - Groupe Multiservices Dahoué. Tous droits réservés.</p>
      </div>
    </div>
  `;
  return transporter.sendMail({ from, to, subject, html });
}

// ────────────────────────────────────────────────
// 2. Email KYC Approuvé
// ────────────────────────────────────────────────
async function sendKycApprovedEmail({ to, denominationSociale }) {
  const subject = '🟢 Compte Gold B2B GMD Activé — Action requise dans 48H';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
      <div style="background: linear-gradient(135deg, #14532d, #166534); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">GMD Créance</h1>
        <p style="margin: 6px 0 0; color: #86efac; font-size: 13px;">Plateforme B2B Officielle</p>
      </div>
      <div style="padding: 32px 28px;">
        <h2 style="color: #4ade80; font-size: 18px; margin-bottom: 8px;">🎉 Félicitations ! Votre compte est activé</h2>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,
        </p>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Nous avons le plaisir de vous informer que votre dossier de conformité a été <strong style="color: #4ade80;">approuvé</strong> par notre équipe. Votre <strong style="color: #fbbf24;">compte Gold B2B GMD</strong> est désormais pleinement actif.
        </p>
        <div style="background: #fbbf2418; border: 1px solid #f59e0b50; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px; color: #fbbf24; font-size: 14px; font-weight: 800;">⚠️ Action obligatoire — Délai de 48 heures</p>
          <p style="margin: 0; color: #d4d4d8; font-size: 13px; line-height: 1.7;">
            Pour maintenir votre compte actif, vous devez <strong style="color: #fff;">effectuer votre premier achat à crédit dans les 48 heures</strong> suivant la réception de ce message.
          </p>
          <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
            Passé ce délai, votre compte sera <strong style="color: #f87171;">automatiquement désactivé</strong>. Seul un administrateur GMD pourra procéder à sa réactivation.
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 12px 28px; background: #166534; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
            Accéder à ma Boutique GMD →
          </a>
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.6;">
          Pour toute assistance, contactez-nous à <a href="mailto:${FROM_EMAIL}" style="color: #4ade80;">${FROM_EMAIL}</a>.
        </p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #1f1f1f; text-align: center;">
        <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} GMD - Groupe Multiservices Dahoué. Tous droits réservés.</p>
      </div>
    </div>
  `;
  return transporter.sendMail({ from, to, subject, html });
}

// ────────────────────────────────────────────────
// 3. Email KYC Rejeté
// ────────────────────────────────────────────────
async function sendKycRejectedEmail({ to, denominationSociale }) {
  const subject = '🔴 Votre dossier GMD B2B — Décision de l\'équipe de conformité';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
      <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">GMD Créance</h1>
        <p style="margin: 6px 0 0; color: #fca5a5; font-size: 13px;">Plateforme B2B Officielle</p>
      </div>
      <div style="padding: 32px 28px;">
        <h2 style="color: #f87171; font-size: 18px; margin-bottom: 8px;">Résultat de l'examen de conformité</h2>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Bonjour, représentant de <strong style="color: #fff;">${denominationSociale}</strong>,
        </p>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Après examen de votre dossier de conformité KYC, notre équipe a malheureusement <strong style="color: #f87171;">décidé de ne pas valider</strong> votre demande d'ouverture de compte Gold B2B à ce stade.
        </p>
        <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <p style="margin: 0 0 8px; color: #d4d4d8; font-size: 13px; font-weight: 700;">📌 Raisons possibles :</p>
          <ul style="color: #a1a1aa; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">
            <li>Documents fournis illisibles ou non conformes</li>
            <li>Divergence entre la dénomination sociale et le RCCM</li>
            <li>Conditions d'ancienneté ou de volume d'achats non remplies</li>
            <li>Informations du gérant ou de l'avaliseur incomplètes</li>
          </ul>
        </div>
        <p style="color: #a1a1aa; line-height: 1.7; font-size: 14px;">
          Nous vous invitons à contacter notre équipe de conformité pour obtenir des précisions sur les motifs de rejet et les démarches à suivre pour soumettre un nouveau dossier.
        </p>
        <p style="color: #71717a; font-size: 12px; line-height: 1.6;">
          Contactez-nous à <a href="mailto:${FROM_EMAIL}" style="color: #f87171;">${FROM_EMAIL}</a>.
        </p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #1f1f1f; text-align: center;">
        <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} GMD - Groupe Multiservices Dahoué. Tous droits réservés.</p>
      </div>
    </div>
  `;
  return transporter.sendMail({ from, to, subject, html });
}

module.exports = {
  sendAccountCreatedEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail
};
