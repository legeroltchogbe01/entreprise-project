const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all companies (Admin KYC Review & Directory)
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { wallet: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    console.error('Fetch admin companies error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des entreprises.' });
  }
});

// Update KYC Status
router.post('/companies/:id/kyc', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Statut KYC invalide. Utilisez "APPROVED" ou "REJECTED".' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: { kyc_status: status }
    });

    res.json({
      message: `Statut KYC de l'entreprise mis à jour avec succès : ${status}`,
      company
    });

  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du KYC.' });
  }
});

// Get global maturities matrix (all orders and schedules)
router.get('/schedules', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        company: {
          select: {
            denomination_sociale: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const matrix = [];
    orders.forEach(order => {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
      schedule.forEach(installment => {
        matrix.push({
          order_id: order.id,
          order_number: order.order_number,
          company_id: order.company_id,
          company_name: order.company.denomination_sociale,
          company_phone: order.company.phone,
          installment_number: installment.installment_number,
          due_date: installment.due_date,
          amount: installment.amount,
          paid: installment.paid,
          paid_at: installment.paid_at
        });
      });
    });

    // Sort by due date
    matrix.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    res.json(matrix);
  } catch (error) {
    console.error('Fetch global schedules error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de la matrice des créances.' });
  }
});

// Simulate WhatsApp Reminder API
// Reminders are triggered relative to maturity date: J-3 (before), J+1 (after), J+7 (late warning)
router.post('/whatsapp-reminder', async (req, res) => {
  try {
    const { companyName, phone, amount, dueDate, type } = req.body; // type: 'J-3' | 'J+1' | 'J+7'

    if (!companyName || !phone || !amount || !dueDate || !type) {
      return res.status(400).json({ error: 'Informations de relance incomplètes.' });
    }

    let message = '';
    const formattedAmount = Number(amount).toLocaleString('fr-FR') + ' FCFA';
    const formattedDate = new Date(dueDate).toLocaleDateString('fr-FR');

    switch (type) {
      case 'J-3':
        message = `*Rappel GMD Créance [J-3]* : Bonjour ${companyName}. Nous vous rappelons que votre mensualité de ${formattedAmount} arrive à échéance le ${formattedDate}. Assurez-vous d'avoir les fonds requis sur votre portefeuille d'acompte.`;
        break;
      case 'J+1':
        message = `*Relance GMD Créance [J+1]* : Attention ${companyName}. Votre mensualité de ${formattedAmount} due le ${formattedDate} n'a pas encore été réglée. Veuillez procéder au remboursement afin d'éviter le blocage de votre compte.`;
        break;
      case 'J+7':
        message = `*AVERTISSEMENT GMD Créance [J+7]* : IMPORTANT - ${companyName}. Constat de défaut de paiement pour la mensualité de ${formattedAmount} due depuis le ${formattedDate}. Votre dossier est transmis au service de recouvrement.`;
        break;
      default:
        message = `Notification de mensualité GMD Créance : ${formattedAmount} due le ${formattedDate}.`;
    }

    // Simulated API Log
    console.log(`\n--- [SIMULATION WHATSAPP BUSINESS API] ---`);
    console.log(`Destinataire : ${phone}`);
    console.log(`Type         : ${type}`);
    console.log(`Message      : ${message}`);
    console.log(`Status       : SENT SUCCESSFULLY`);
    console.log(`-------------------------------------------\n`);

    res.json({
      success: true,
      message: `Relance WhatsApp (${type}) simulée avec succès pour ${companyName}.`,
      payload: {
        to: phone,
        type,
        message
      }
    });

  } catch (error) {
    console.error('WhatsApp reminder simulation error:', error);
    res.status(500).json({ error: 'Erreur lors de la simulation de la relance.' });
  }
});

// Admin stats summary
router.get('/stats', async (req, res) => {
  try {
    const companiesCount = await prisma.company.count();
    const pendingKycCount = await prisma.company.count({ where: { kyc_status: 'PENDING' } });
    
    const wallets = await prisma.wallet.findMany();
    const totalCreditLimit = wallets.reduce((sum, w) => sum + Number(w.credit_initial), 0);
    const totalCreditUsed = wallets.reduce((sum, w) => sum + Number(w.credit_utilise), 0);

    const orders = await prisma.order.findMany();
    let totalPaid = 0;
    let totalUnpaid = 0;

    orders.forEach(order => {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
      schedule.forEach(inst => {
        if (inst.paid) {
          totalPaid += inst.amount;
        } else {
          totalUnpaid += inst.amount;
        }
      });
    });

    const recoveryRate = totalPaid + totalUnpaid > 0 ? (totalPaid / (totalPaid + totalUnpaid)) * 100 : 100;

    res.json({
      companiesCount,
      pendingKycCount,
      totalCreditLimit,
      totalCreditUsed,
      totalPaid,
      totalUnpaid,
      recoveryRate: Number(recoveryRate.toFixed(2))
    });

  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
});

module.exports = router;
