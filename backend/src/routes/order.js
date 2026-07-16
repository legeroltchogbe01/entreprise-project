const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { sendOrderConfirmedEmail, sendInstallmentPaidEmail, sendAdminNewOrderEmail, sendAdminInstallmentPaidEmail } = require('../utils/emailService');

// Get order history for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await prisma.order.findMany({
      where: { company_id: companyId },
      include: {
        order_items: {
          include: { product: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Fetch company orders error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
  }
});

// Submit a new order
router.post('/', async (req, res) => {
  try {
    const { companyId, items, paymentMode = 'echelonne', transactionId } = req.body; // items: [ { productId, quantity } ]

    if (!companyId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Informations de commande incomplètes.' });
    }

    // Get company and wallet
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' });
    }

    if (company.kyc_status !== 'APPROVED') {
      return res.status(400).json({ error: 'Votre dossier KYC n\'a pas encore été approuvé.' });
    }

    const wallet = company.wallet;
    const walletActive = wallet && wallet.activated_at;

    // 1. Fetch products and calculate total amount
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product) {
        return res.status(404).json({ error: `Produit introuvable : ${item.productId}` });
      }
      
      const price = Number(product.price);
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        quantity: item.quantity,
        price: price,
        motif: item.motif || 'Standard'
      });
    }

    // Calculate final order amount (5% discount for non-echelonne direct payments)
    const discountedTotal = (paymentMode === 'cash' || paymentMode === 'acompte') 
      ? totalAmount * 0.95 
      : totalAmount;

    let paymentSchedule = [];

    // If Cash or Acompte 50% : verify Kkiapay transaction first
    if (paymentMode === 'cash' || paymentMode === 'acompte') {
      const expectedAmount = paymentMode === 'cash' 
        ? discountedTotal 
        : discountedTotal / 2.0;

      const isSandboxMode = process.env.KKIAPAY_SANDBOX === 'true';
      const isSandboxBypass = isSandboxMode && (!transactionId || transactionId === 'sandbox_bypass');

      if (!isSandboxBypass) {
        if (!transactionId) {
          return res.status(400).json({ error: 'Un identifiant de transaction Kkiapay est obligatoire pour valider cette commande.' });
        }

        // Verify transaction via Kkiapay SDK
        const { kkiapay } = require("@kkiapay-org/nodejs-sdk");
        const k = kkiapay({
          privatekey: process.env.KKIAPAY_PRIVATE_KEY,
          publickey: process.env.KKIAPAY_PUBLIC_KEY,
          secretkey: process.env.KKIAPAY_SECRET_KEY,
          sandbox: isSandboxMode
        });

        let verifyResponse;
        try {
          verifyResponse = await k.verify(transactionId);
        } catch (e) {
          console.error('Kkiapay SDK order verification error:', e);
          return res.status(400).json({ error: 'Échec de la validation de la transaction auprès de Kkiapay.' });
        }

        if (!verifyResponse || verifyResponse.status !== 'SUCCESS') {
          return res.status(400).json({ error: `La transaction Kkiapay n'a pas réussi. Statut: ${verifyResponse ? verifyResponse.status : 'INCONNU'}` });
        }

        const verifiedAmount = parseFloat(verifyResponse.amount);
        if (Math.abs(verifiedAmount - expectedAmount) > 20) { // allow small variance
           return res.status(400).json({ error: `Montant de transaction incorrect. Requis: ${expectedAmount} FCFA, Reçu: ${verifiedAmount} FCFA.` });
        }
      }

      // Build specific payment schedule
      if (paymentMode === 'cash') {
        paymentSchedule = [{
          type: 'cash',
          amount: discountedTotal,
          paid: true,
          paid_at: new Date().toISOString(),
          transaction_id: transactionId || 'sandbox_bypass'
        }];
      } else {
        // Acompte 50%
        paymentSchedule = [
          {
            type: 'acompte_50',
            amount: discountedTotal / 2.0,
            paid: true,
            paid_at: new Date().toISOString(),
            transaction_id: transactionId || 'sandbox_bypass'
          },
          {
            type: 'livraison_50',
            amount: discountedTotal / 2.0,
            paid: false,
            paid_at: null,
            transaction_id: null
          }
        ];
      }
    } else {
      // Echelonne payment mode
      if (!wallet || !wallet.activated_at) {
        const minActivationSetting = await prisma.systemSetting.findUnique({
          where: { key: 'MIN_ACTIVATION_DEPOSIT' }
        });
        const minDeposit = minActivationSetting ? parseFloat(minActivationSetting.value) : 5000000.00;
        return res.status(400).json({ error: `Votre portefeuille n'a pas été activé financièrement. Veuillez effectuer le dépôt de démarrage de ${minDeposit.toLocaleString('fr-FR')} FCFA.` });
      }

      // Check 8-Month Safeguard Veto Rule
      const activatedAt = new Date(wallet.activated_at);
      const now = new Date();
      
      let monthsDiff = (now.getFullYear() - activatedAt.getFullYear()) * 12 + now.getMonth() - activatedAt.getMonth();
      if (now.getDate() < activatedAt.getDate() && monthsDiff > 0) {
        monthsDiff--;
      }

      const eligibilitySetting = await prisma.systemSetting.findUnique({
        where: { key: 'PURCHASE_ELIGIBILITY_PERIOD' }
      });
      const eligibilityPeriod = eligibilitySetting ? parseInt(eligibilitySetting.value, 10) : 4;

      if (monthsDiff >= eligibilityPeriod) {
        return res.status(400).json({ 
          error: `La période autorisée pour effectuer des achats échelonnés est expirée (${monthsDiff} mois écoulés depuis l'activation). Pour finaliser votre commande, veuillez choisir l'option de paiement Cash.`
        });
      }

      // Check seuil global (minActivationDeposit * 3)
      const minActivationSetting = await prisma.systemSetting.findUnique({
        where: { key: 'MIN_ACTIVATION_DEPOSIT' }
      });
      const minDeposit = minActivationSetting ? parseFloat(minActivationSetting.value) : 5000000.00;
      const dynamicSeuil = minDeposit * 3.0;

      if (totalAmount > dynamicSeuil) {
        return res.status(400).json({
          error: `Le total des produits (${totalAmount.toLocaleString('fr-FR')} FCFA) dépasse le seuil global autorisé de ${dynamicSeuil.toLocaleString('fr-FR')} FCFA. Pour continuer cet achat, vous devez effectuer un paiement cash.`
        });
      }

      const acomptePortion = totalAmount / 3.0;
      const creditPortion = (totalAmount * 2.0) / 3.0;

      // Check balances
      const currentAcompte = Number(wallet.acompte_restant);
      const currentCreditUsed = Number(wallet.credit_utilise);
      const creditLimit = Number(wallet.credit_initial);
      const availableCredit = creditLimit - currentCreditUsed;

      if (currentAcompte < acomptePortion) {
        return res.status(400).json({ 
          error: `Solde d'Acompte insuffisant. Requis: ${acomptePortion.toLocaleString()} FCFA (1/3), Disponible: ${currentAcompte.toLocaleString()} FCFA.` 
        });
      }

      if (availableCredit < creditPortion) {
        return res.status(400).json({ 
          error: `Ligne de crédit insuffisante. Requis: ${creditPortion.toLocaleString()} FCFA (2/3), Disponible: ${availableCredit.toLocaleString()} FCFA.` 
        });
      }

      const remainingMonths = 12 - monthsDiff;
      const monthlyPayment = creditPortion / remainingMonths;

      for (let i = 0; i < remainingMonths; i++) {
        const dueDate = new Date(activatedAt);
        dueDate.setMonth(activatedAt.getMonth() + monthsDiff + i + 1);
        dueDate.setDate(10);
        
        paymentSchedule.push({
          installment_number: i + 1,
          due_date: dueDate.toISOString().split('T')[0],
          amount: Number(monthlyPayment.toFixed(2)),
          paid: false,
          paid_at: null
        });
      }

      // Update Wallet for B2B Echelonne
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          acompte_restant: currentAcompte - acomptePortion,
          credit_utilise: currentCreditUsed + creditPortion
        }
      });
    }

    // Generate order number
    const orderNumber = 'GMD-' + Math.floor(100000 + Math.random() * 900000);

    // Create Order
    const result = await prisma.order.create({
      data: {
        company_id: companyId,
        order_number: orderNumber,
        total_amount: discountedTotal,
        payment_schedule: paymentSchedule,
        status: 'APPROVED',
        order_items: {
          create: orderItemsData.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            motif: item.motif
          }))
        }
      }
    });

    // Fetch full order details for email
    let fullOrderItems = [];
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: result.id },
        include: {
          order_items: {
            include: { product: true }
          }
        }
      });
      if (fullOrder) {
        fullOrderItems = fullOrder.order_items;
      }
    } catch (e) {
      console.error('[ORDER_EMAIL_FETCH] Erreur lors de la récupération des articles:', e);
    }

    // ── Email de confirmation de commande ──────────────────────────────────
    const recipients = [company.email, company.manager_email].filter(Boolean).join(', ');
    sendOrderConfirmedEmail({
      to: recipients,
      denominationSociale: company.denomination_sociale,
      orderRef: orderNumber,
      totalAmount,
      paymentMode: 'echelonne',
      acompte: acomptePortion
    }).catch(err => console.error('[ORDER] Erreur email confirmation commande:', err.message));

    // ── Email notification admin pour nouvelle commande ────────────────────
    sendAdminNewOrderEmail({
      company,
      orderRef: orderNumber,
      totalAmount,
      items: fullOrderItems
    }).catch(err => console.error('[ORDER] Erreur email notification admin commande:', err.message));
    // ─────────────────────────────────────────────────────────────────────

    res.status(201).json({
      message: 'Commande validée avec succès.',
      order: result
    });

  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de votre commande : ' + error.message });
  }
});

// Pay/Refund a single maturity installment
router.post('/:orderId/pay-installment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { installmentNumber, transactionId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { company: { include: { wallet: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
    const targetInstallment = schedule.find(item => item.installment_number === Number(installmentNumber));

    if (!targetInstallment) {
      return res.status(404).json({ error: 'Échéance introuvable.' });
    }

    if (targetInstallment.paid) {
      return res.status(400).json({ error: 'Cette échéance est déjà payée.' });
    }

    const amountToPay = targetInstallment.amount;
    let verifiedAmount = amountToPay;

    const isSandboxMode = process.env.KKIAPAY_SANDBOX === 'true';
    const isSandboxBypass = isSandboxMode && (!transactionId || transactionId === 'sandbox_bypass');

    if (!isSandboxBypass) {
      // Live mode: transactionId is MANDATORY
      if (!transactionId) {
        return res.status(400).json({ error: 'Un identifiant de transaction Kkiapay est obligatoire pour valider ce paiement.' });
      }

      // Verify transaction via Kkiapay SDK
      const { kkiapay } = require("@kkiapay-org/nodejs-sdk");
      const k = kkiapay({
        privatekey: process.env.KKIAPAY_PRIVATE_KEY,
        publickey: process.env.KKIAPAY_PUBLIC_KEY,
        secretkey: process.env.KKIAPAY_SECRET_KEY,
        sandbox: isSandboxMode
      });

      let verifyResponse;
      try {
        verifyResponse = await k.verify(transactionId);
      } catch (e) {
        console.error('Kkiapay SDK verify error:', e);
        return res.status(400).json({ error: 'Échec de la validation de la transaction auprès de Kkiapay.' });
      }

      if (!verifyResponse || verifyResponse.status !== 'SUCCESS') {
        return res.status(400).json({ error: `La transaction Kkiapay n'a pas réussi. Statut: ${verifyResponse ? verifyResponse.status : 'INCONNU'}` });
      }

      verifiedAmount = parseFloat(verifyResponse.amount);
      if (Math.abs(verifiedAmount - amountToPay) > 10) { // allow tiny variance
         return res.status(400).json({ error: `Montant de transaction incorrect. Requis: ${amountToPay} FCFA, Reçu: ${verifiedAmount} FCFA.` });
      }
    }

    // Mark as paid
    targetInstallment.paid = true;
    targetInstallment.paid_at = new Date().toISOString();

    const amountPaid = targetInstallment.amount;

    // Update Order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_schedule: schedule
      }
    });

    // Credit the credit line back
    const wallet = order.company.wallet;
    const currentCreditUsed = Number(wallet.credit_utilise);
    const newCreditUsed = Math.max(0, currentCreditUsed - amountPaid);
    
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        credit_utilise: newCreditUsed
      }
    });

    // ── Email confirmation paiement mensualité ──────────────────────────
    const company = order.company;
    const remainingCredit = Math.max(0, Number(order.company.wallet.credit_utilise) - amountPaid);
    const emailRecipients = [company.email, company.manager_email].filter(Boolean).join(', ');
    sendInstallmentPaidEmail({
      to: emailRecipients,
      denominationSociale: company.denomination_sociale,
      amount: amountPaid,
      dueDate: targetInstallment.due_date,
      remaining: remainingCredit,
      managerName: company.manager_name,
      ifu: company.ifu_number,
      transactionId: transactionId || 'SANDBOX_BYPASS',
      orderNumber: order.order_number,
      installmentNumber: targetInstallment.installment_number
    }).catch(err => console.error('[INSTALLMENT] Erreur email paiement:', err.message));

    // ── Email notification admin pour paiement mensualité ──────────────────
    sendAdminInstallmentPaidEmail({
      company,
      amount: amountPaid,
      orderRef: order.order_number,
      installmentNumber: targetInstallment.installment_number
    }).catch(err => console.error('[INSTALLMENT] Erreur email notification admin paiement:', err.message));
    // ─────────────────────────────────────────────────────────────────────

    // ── Check if this was the last pending installment for all orders (Contract completed) ──
    try {
      const allOrders = await prisma.order.findMany({
        where: { company_id: company.id }
      });
      let allPaid = true;
      for (const ord of allOrders) {
        const sched = JSON.parse(JSON.stringify(ord.payment_schedule || []));
        if (sched.some(inst => !inst.paid)) {
          allPaid = false;
          break;
        }
      }
      if (allPaid) {
        const { sendContractCompletedEmail } = require('../utils/emailService');
        sendContractCompletedEmail({
          to: emailRecipients,
          denominationSociale: company.denomination_sociale,
          managerName: company.manager_name
        }).catch(err => console.error('[CONTRACT_COMPLETED] Erreur email fin de contrat:', err.message));
      }
    } catch (e) {
      console.error('[CONTRACT_COMPLETED] Error checking completion:', e);
    }

    res.json({
      message: `Échéance N°${installmentNumber} payée avec succès (${amountPaid.toLocaleString()} FCFA). Ligne de crédit restaurée.`,
      payment_schedule: schedule
    });

  } catch (error) {
    console.error('Installment payment error:', error);
    res.status(500).json({ error: 'Erreur lors du paiement de l\'échéance.', details: error.message });
  }
});

// Pay multiple maturity installments (Global Monthly Due) in one transaction
router.post('/pay-monthly-due', async (req, res) => {
  try {
    const { companyId, transactionId, installments } = req.body;

    if (!companyId || !installments || !Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({ error: 'Informations de règlement incomplètes.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { wallet: true }
    });

    if (!company || !company.wallet) {
      return res.status(404).json({ error: 'Portefeuille ou entreprise introuvable.' });
    }

    const orderIds = [...new Set(installments.map(i => i.orderId))];
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, company_id: companyId }
    });

    let totalRequired = 0;
    const updates = [];

    for (const order of orders) {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
      const targetItems = installments.filter(i => i.orderId === order.id);
      let orderModified = false;

      for (const item of targetItems) {
        const inst = schedule.find(x => x.installment_number === Number(item.installmentNumber));
        if (inst && !inst.paid) {
          inst.paid = true;
          inst.paid_at = new Date().toISOString();
          totalRequired += parseFloat(inst.amount);
          orderModified = true;
        }
      }

      if (orderModified) {
        updates.push({
          orderId: order.id,
          schedule: schedule
        });
      }
    }

    if (totalRequired === 0) {
      return res.status(400).json({ error: 'Toutes les échéances soumises sont déjà payées.' });
    }

    let verifiedAmount = totalRequired;

    const isSandboxMode = process.env.KKIAPAY_SANDBOX === 'true';
    const isSandboxBypass = isSandboxMode && (!transactionId || transactionId === 'sandbox_bypass');

    if (!isSandboxBypass) {
      // Live mode: transactionId is MANDATORY
      if (!transactionId) {
        return res.status(400).json({ error: 'Un identifiant de transaction Kkiapay est obligatoire pour valider ce paiement.' });
      }

      const { kkiapay } = require("@kkiapay-org/nodejs-sdk");
      const k = kkiapay({
        privatekey: process.env.KKIAPAY_PRIVATE_KEY,
        publickey: process.env.KKIAPAY_PUBLIC_KEY,
        secretkey: process.env.KKIAPAY_SECRET_KEY,
        sandbox: isSandboxMode
      });

      console.log('[KKIAPAY] Verifying installment transaction:', transactionId);

      let verifyResponse;
      try {
        verifyResponse = await k.verify(transactionId);
      } catch (e) {
        console.error('Kkiapay SDK verify error:', e);
        return res.status(400).json({ error: 'Échec de la validation de la transaction auprès de Kkiapay.' });
      }

      if (!verifyResponse || verifyResponse.status !== 'SUCCESS') {
        return res.status(400).json({ error: `La transaction Kkiapay n'a pas réussi. Statut: ${verifyResponse ? verifyResponse.status : 'INCONNU'}` });
      }

      verifiedAmount = parseFloat(verifyResponse.amount);
      if (Math.abs(verifiedAmount - totalRequired) > 10) {
        return res.status(400).json({ error: `Montant de transaction incorrect. Requis: ${totalRequired} FCFA, Reçu: ${verifiedAmount} FCFA.` });
      }
    }

    // Update payment schedules for each order
    for (const upd of updates) {
      await prisma.order.update({
        where: { id: upd.orderId },
        data: { payment_schedule: upd.schedule }
      });
    }

    // Reduce credit utilise
    const currentCreditUtilised = parseFloat(company.wallet.credit_utilise);
    const newCreditUtilised = Math.max(0, currentCreditUtilised - totalRequired);

    await prisma.wallet.update({
      where: { id: company.wallet.id },
      data: {
        credit_utilise: newCreditUtilised
      }
    });

    const emailRecipients = [company.email, company.manager_email].filter(Boolean).join(', ');
    
    sendInstallmentPaidEmail({
      to: emailRecipients,
      denominationSociale: company.denomination_sociale,
      amount: totalRequired,
      dueDate: 'Mensualités multiples',
      remaining: newCreditUtilised,
      managerName: company.manager_name,
      ifu: company.ifu_number,
      transactionId: transactionId || 'SANDBOX_BYPASS',
      orderNumber: 'REGLEMENT_GLOBAL',
      installmentNumber: installments.map(i => i.installmentNumber).join(', ')
    }).catch(err => console.error('[INSTALLMENT_MULTIPLE] Erreur email paiement:', err.message));

    // Admin notify
    sendAdminInstallmentPaidEmail({
      company,
      amount: totalRequired,
      orderRef: 'REGLEMENT_GLOBAL',
      installmentNumber: installments.map(i => i.installmentNumber).join(', ')
    }).catch(err => console.error('[INSTALLMENT_MULTIPLE] Erreur email admin:', err.message));

    // ── Check if this was the last pending installment for all orders (Contract completed) ──
    try {
      const allOrders = await prisma.order.findMany({
        where: { company_id: company.id }
      });
      let allPaid = true;
      for (const ord of allOrders) {
        const sched = JSON.parse(JSON.stringify(ord.payment_schedule || []));
        if (sched.some(inst => !inst.paid)) {
          allPaid = false;
          break;
        }
      }
      if (allPaid) {
        const { sendContractCompletedEmail } = require('../utils/emailService');
        sendContractCompletedEmail({
          to: emailRecipients,
          denominationSociale: company.denomination_sociale,
          managerName: company.manager_name
        }).catch(err => console.error('[CONTRACT_COMPLETED] Erreur email fin de contrat:', err.message));
      }
    } catch (e) {
      console.error('[CONTRACT_COMPLETED] Error checking completion:', e);
    }

    res.json({
      message: `Échéance mensuelle globale de ${totalRequired.toLocaleString('fr-FR')} FCFA réglée avec succès. Votre limite de crédit a été restaurée.`,
      creditUtilisedRestored: totalRequired
    });

  } catch (error) {
    console.error('Pay monthly due error:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du règlement global de l\'échéance.', details: error.message });
  }
});

// GET PDF receipt for a paid installment
router.get('/receipt/:orderId/:installmentNumber', async (req, res) => {
  try {
    const { orderId, installmentNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { company: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const schedule = JSON.parse(JSON.stringify(order.payment_schedule));
    const targetInstallment = schedule.find(item => item.installment_number === Number(installmentNumber));

    if (!targetInstallment) {
      return res.status(404).json({ error: 'Échéance introuvable.' });
    }

    if (!targetInstallment.paid) {
      return res.status(400).json({ error: 'Cette échéance n\'a pas encore été réglée.' });
    }

    // Generate PDF
    const { generateReceiptPdf } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateReceiptPdf({
      type: 'mensualite',
      denominationSociale: order.company.denomination_sociale,
      managerName: order.company.manager_name,
      managerEmail: order.company.manager_email,
      ifu: order.company.ifu_number,
      amount: Number(targetInstallment.amount),
      transactionId: targetInstallment.paid_at ? 'TX_' + targetInstallment.installment_number + '_' + new Date(targetInstallment.paid_at).getTime() : 'SANDBOX_TX',
      orderNumber: order.order_number,
      installmentNumber: targetInstallment.installment_number,
      dueDate: targetInstallment.due_date
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Recu_GMD_${order.order_number}_Ech${installmentNumber}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du reçu PDF.' });
  }
});

// GET /api/orders/company/:companyId/purchase-bulletin
router.get('/company/:companyId/purchase-bulletin', async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' });
    }

    const orders = await prisma.order.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    // Compute Client stats
    const totalPurchased = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    // Total Paid is: all paid installments + 1/3 deposit of all orders
    let totalPaidInstallments = 0;
    let totalRemaining = 0;
    for (const order of orders) {
      const schedule = order.payment_schedule || [];
      const paidAmt = schedule.filter(s => s.paid).reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const acompte = Number(order.total_amount || 0) / 3;
      totalPaidInstallments += (acompte + paidAmt);
    }
    
    totalRemaining = totalPurchased - totalPaidInstallments;
    const repaymentRate = totalPurchased > 0 ? ((totalPaidInstallments / totalPurchased) * 100).toFixed(0) : 0;

    const stats = {
      totalPurchased,
      totalPaid: totalPaidInstallments,
      totalRemaining,
      ordersCount: orders.length,
      repaymentRate
    };

    const { generateClientPurchaseReportPdf } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateClientPurchaseReportPdf({ company, stats, orders });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bulletin_Achats_${company.denomination_sociale}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Client purchase bulletin error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du bulletin d\'achat.' });
  }
});

module.exports = router;
