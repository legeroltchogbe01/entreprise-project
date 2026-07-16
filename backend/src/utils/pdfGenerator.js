const PDFDocument = require('pdfkit');

/**
 * Génère un reçu PDF au format Buffer
 * @param {Object} params
 * @param {string} params.type - 'acompte' | 'mensualite'
 * @param {string} params.denominationSociale
 * @param {string} params.managerName
 * @param {string} params.managerEmail
 * @param {string} params.ifu
 * @param {number} params.amount
 * @param {string} params.transactionId
 * @param {string} [params.orderNumber]
 * @param {number} [params.installmentNumber]
 * @param {string} [params.dueDate]
 * @returns {Promise<Buffer>}
 */
function generateReceiptPdf({
  type,
  denominationSociale,
  managerName,
  managerEmail,
  ifu,
  amount,
  transactionId,
  orderNumber = '',
  installmentNumber = null,
  dueDate = null
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Style System / Colors
      const primaryColor = '#7f1d1d'; // Rouge Galassy Meuble Décor
      const textColor = '#1f2937';
      const lightGray = '#f3f4f6';

      // ── HEADER ──
      doc.rect(0, 0, 595, 120).fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('GALASSY MEUBLE DÉCOR', 40, 35);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Plateforme B2B Officielle · Reçu de Paiement Électronique', 40, 65);

      doc.fontSize(9)
         .text('© GMD - GALASSY MEUBLE DECOR · Calavi, Bénin', 40, 80);

      // Helper to pad installment numbers to 2 digits (e.g. 01, 02)
      const formatInst = (num) => {
        if (!num) return '';
        return String(num)
          .split(',')
          .map(s => s.trim().padStart(2, '0'))
          .join(', ');
      };

      const formattedInstNumber = formatInst(installmentNumber);

      // ── TRANSACTION DETAILS HEADER ──
      const title = type === 'acompte' 
        ? 'REÇU DE DÉPÔT INITIAL (ACTIVATION)' 
        : `REÇU DE RÈGLEMENT DE MENSUALITÉ N°${formattedInstNumber}`;

      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(title, 40, 150);

      doc.moveTo(40, 170).lineTo(555, 170).strokeColor('#e5e7eb').stroke();

      // ── CLIENT & TRANSACTION SECTIONS ──
      // Column 1: Client Info
      doc.fillColor('#4b5563').fontSize(9).font('Helvetica-Bold').text('INFORMATIONS CLIENT', 40, 190);
      doc.fillColor(textColor).fontSize(10).font('Helvetica')
         .text(`Entreprise : ${denominationSociale}`, 40, 210)
         .text(`Gérant : ${managerName}`, 40, 225)
         .text(`E-mail : ${managerEmail}`, 40, 240)
         .text(`IFU : ${ifu}`, 40, 255);

      // Column 2: Payment Info
      doc.fillColor('#4b5563').fontSize(9).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT', 300, 190);
      
      const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const paymentObject = type === 'acompte' 
        ? "Dépôt de démarrage (Activation de portefeuille)" 
        : `Règlement d'échéance de crédit N°${formattedInstNumber}`;

      doc.fillColor(textColor).fontSize(10).font('Helvetica')
         .text(`Émetteur : GALASSY MEUBLE DECOR`, 300, 210)
         .text(`Objet : ${paymentObject}`, 300, 225)
         .text(`Date : ${dateStr}`, 300, 240)
         .text(`ID Transaction : ${transactionId}`, 300, 255)
         .text(`Statut : Payé (Kkiapay Verified)`, 300, 270);

      if (orderNumber) {
        doc.text(`Réf Commande : ${orderNumber}`, 300, 285);
      }
      if (dueDate) {
        const dueFormatted = new Date(dueDate).toLocaleDateString('fr-FR');
        doc.text(`Date échéance réglée : ${dueFormatted}`, 300, 300);
      }

      // ── AMOUNT BOX ──
      doc.rect(40, 340, 515, 60).fill(lightGray);
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('MONTANT ACQUITTÉ', 60, 355);
      doc.fillColor(textColor).fontSize(18).font('Helvetica-Bold').text(`${amount.toLocaleString('fr-FR')} FCFA`, 60, 370);

      doc.fillColor('#10b981').fontSize(10).font('Helvetica-Bold').text('✓ TRANSACTION SÉCURISÉE & CONFIRMÉE', 350, 365);

      // ── TERMS & CONDITIONS FOOTER ──
      doc.moveTo(40, 430).lineTo(555, 430).strokeColor('#e5e7eb').stroke();
      
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Oblique')
         .text('Ce document officiel fait office de preuve de paiement pour les services B2B de Galassy Meuble Décor.', 40, 450, { width: 515, align: 'center' })
         .text('Toute falsification de ce reçu électronique est passible de poursuites judiciaires.', 40, 465, { width: 515, align: 'center' });

      // End
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Génère le rapport périodique Admin en PDF
 */
function generateAdminReportPdf({ reportType, reportData }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const primaryColor = '#7f1d1d';
      const textColor = '#1f2937';
      const lightGray = '#f9fafb';

      // Header
      doc.rect(0, 0, 595, 100).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('GALASSY MEUBLE DÉCOR', 40, 25)
         .fontSize(10)
         .font('Helvetica')
         .text(`Rapport Financier Périodique (${reportType.toUpperCase()}) · Administration B2B`, 40, 55)
         .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 40, 70);

      // Section Synthèse
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('SYNTHÈSE DES CHIFFRES D\'AFFAIRES', 40, 120);
      doc.moveTo(40, 135).lineTo(555, 135).strokeColor('#e5e7eb').stroke();

      const summary = reportData.summary || {};
      const formatFCFA = (val) => `${Number(val || 0).toLocaleString('fr-FR')} FCFA`;

      doc.fillColor(textColor).fontSize(9).font('Helvetica');
      let y = 150;
      const drawRow = (label, val, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(label, 50, y)
           .text(val, 400, y, { align: 'right', width: 140 });
        y += 18;
      };

      drawRow('Volume global de ventes (Chiffre d\'Affaires) :', formatFCFA(summary.totalOrderAmount), true);
      drawRow('  Acomptes perçus (1/3 à la commande) :', formatFCFA(summary.totalAcomptePercu));
      drawRow('  Crédit accordé (2/3 restants) :', formatFCFA(summary.totalCreditAccorde));
      y += 5;
      drawRow('Total des mensualités payées de la période :', formatFCFA(summary.totalInstallmentsPaid));
      drawRow('Dépôts d\'activation des portefeuilles :', formatFCFA(summary.totalActivationDeposits));
      y += 8;
      doc.rect(40, y, 515, 25).fill('#fee2e2');
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('TOTAL ENCAISSÉ GLOBAL (Acomptes + Mensualités + Activations) :', 45, y + 8);
      doc.text(formatFCFA(summary.totalEncaisse), 400, y + 8, { align: 'right', width: 140 });
      y += 35;

      // Section Indicateurs
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('INDICATEURS DE VOLUME & PERFORMANCE', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').stroke();
      y += 12;

      doc.fillColor(textColor).fontSize(9).font('Helvetica');
      drawRow('Nombre total de commandes passées :', String(summary.totalOrders || 0));
      drawRow('Nombre de mensualités réglées :', String(summary.installmentsPaidCount || 0));
      drawRow('Nombre de mensualités en attente de recouvrement :', String(summary.installmentsPendingCount || 0));
      drawRow('Nouvelles activations d\'entreprises :', String(summary.newActivations || 0));
      y += 20;

      // Section List of orders
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('LISTE DES COMMANDES DE LA PÉRIODE', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').stroke();
      y += 10;

      const orders = reportData.orders || [];
      if (orders.length === 0) {
        doc.fontSize(9).font('Helvetica-Oblique').text('Aucune commande enregistrée sur cette période.', 50, y);
      } else {
        // Table Header
        doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
        doc.text('Référence', 45, y);
        doc.text('Client', 120, y);
        doc.text('Date', 270, y);
        doc.text('Total commande', 430, y, { align: 'right', width: 110 });
        y += 12;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').stroke();
        y += 6;

        doc.fillColor(textColor).font('Helvetica').fontSize(8);
        for (const order of orders.slice(0, 15)) { // Limit to 15 to stay on page
          if (y > 750) break; // Simple page breakdown check
          doc.text(order.order_number, 45, y);
          doc.text(order.company?.denomination_sociale || 'Client B2B', 120, y, { width: 140, height: 10, ellipsis: true });
          doc.text(new Date(order.created_at).toLocaleDateString('fr-FR'), 270, y);
          doc.text(formatFCFA(order.total_amount), 430, y, { align: 'right', width: 110 });
          y += 15;
        }

        if (orders.length > 15) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`... et ${orders.length - 15} autres commandes listées dans les archives CSV.`, 45, y);
        }
      }

      // Footer
      doc.moveTo(40, 770).lineTo(555, 770).strokeColor('#e5e7eb').stroke();
      doc.fillColor('#9ca3af').fontSize(8)
         .text('Ce rapport d\'activité est confidentiel et destiné uniquement à la direction générale de Galassy Meuble Décor.', 40, 785, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Génère le bulletin récapitulatif d'achats du Client B2B
 */
function generateClientPurchaseReportPdf({ company, stats, orders }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const primaryColor = '#1e3a8a'; // Bleu Royal Professionnel pour le B2B
      const textColor = '#1f2937';
      const lightGray = '#f9fafb';

      // Header
      doc.rect(0, 0, 595, 100).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('GALASSY MEUBLE DÉCOR', 40, 25)
         .fontSize(10)
         .font('Helvetica')
         .text('Bulletin Récapitulatif Global des Achats et Crédits B2B', 40, 55)
         .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Espace Client Professionnel`, 40, 70);

      // Entreprise
      doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold').text(`DOSSIER B2B : ${company.denomination_sociale.toUpperCase()}`, 40, 115);
      doc.fontSize(9).font('Helvetica')
         .text(`RCCM : ${company.rccm_number} · IFU : ${company.ifu_number}`, 40, 130)
         .text(`Téléphone : ${company.phone} · Gérant : ${company.manager_name}`, 40, 142);
      
      doc.moveTo(40, 155).lineTo(555, 155).strokeColor('#e5e7eb').stroke();

      // Stats Cards Box
      doc.rect(40, 165, 515, 65).fill('#f3f4f6');
      
      const formatFCFA = (val) => `${Number(val || 0).toLocaleString('fr-FR')} FCFA`;

      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL ACHETÉ B2B', 50, 175);
      doc.text('TOTAL DÉJÀ RÉGLÉ', 180, 175);
      doc.text('CRÉANCE RESTANTE', 310, 175);
      doc.text('NB COMMANDES', 450, 175);

      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold');
      doc.text(formatFCFA(stats.totalPurchased), 50, 190);
      doc.text(formatFCFA(stats.totalPaid), 180, 190);
      doc.text(formatFCFA(stats.totalRemaining), 310, 190);
      doc.text(String(stats.ordersCount), 450, 190);

      doc.fillColor('#4b5563').fontSize(8).font('Helvetica-Oblique');
      doc.text(`Taux de remboursement : ${stats.repaymentRate}%`, 50, 212);

      // Orders detail section
      let y = 250;
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('HISTORIQUE DES COMMANDES PROFESSIONNELLES', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').stroke();
      y += 10;

      if (orders.length === 0) {
        doc.fontSize(9).font('Helvetica-Oblique').text('Aucune commande enregistrée à ce jour.', 50, y);
      } else {
        doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
        doc.text('N° Commande', 45, y);
        doc.text('Date', 150, y);
        doc.text('Total', 250, y);
        doc.text('Payé / Restant', 350, y);
        doc.text('Progression', 460, y);
        y += 12;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').stroke();
        y += 6;

        doc.fillColor(textColor).font('Helvetica').fontSize(8);
        for (const order of orders) {
          if (y > 750) break;
          const schedule = order.payment_schedule || [];
          const paidAmt = schedule.filter(s => s.paid).reduce((sum, s) => sum + Number(s.amount || 0), 0);
          const totalAmt = Number(order.total_amount || 0);
          const acompte = totalAmt / 3;
          const totalPaidWithAcompte = acompte + paidAmt;
          const remaining = totalAmt - totalPaidWithAcompte;
          const progression = ((totalPaidWithAcompte / totalAmt) * 100).toFixed(0);

          doc.text(order.order_number, 45, y);
          doc.text(new Date(order.created_at).toLocaleDateString('fr-FR'), 150, y);
          doc.text(formatFCFA(totalAmt), 250, y);
          doc.text(`${formatFCFA(totalPaidWithAcompte)} / ${formatFCFA(remaining)}`, 350, y);
          doc.text(`${progression}%`, 460, y);
          y += 16;
        }
      }

      // Footer
      doc.moveTo(40, 770).lineTo(555, 770).strokeColor('#e5e7eb').stroke();
      doc.fillColor('#9ca3af').fontSize(8)
         .text('Ce bulletin récapitulatif a valeur de relevé de situation financière de votre compte professionnel.', 40, 785, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPdf, generateAdminReportPdf, generateClientPurchaseReportPdf };
