const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    const { companyId, items } = req.body; // items: [ { productId, quantity } ]

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
    if (!wallet || !wallet.activated_at) {
      const minActivationSetting = await prisma.systemSetting.findUnique({
        where: { key: 'MIN_ACTIVATION_DEPOSIT' }
      });
      const minDeposit = minActivationSetting ? parseFloat(minActivationSetting.value) : 5000000.00;
      return res.status(400).json({ error: `Votre portefeuille n'a pas été activé financièrement. Veuillez effectuer le dépôt de démarrage de ${minDeposit.toLocaleString('fr-FR')} FCFA.` });
    }

    // 1. Check 8-Month Safeguard Veto Rule
    const activatedAt = new Date(wallet.activated_at);
    const now = new Date();
    
    // Calculate months difference
    let monthsDiff = (now.getFullYear() - activatedAt.getFullYear()) * 12 + now.getMonth() - activatedAt.getMonth();
    
    // Adjust if current day is before activation day (not yet full month)
    if (now.getDate() < activatedAt.getDate() && monthsDiff > 0) {
      monthsDiff--;
    }

    // Safest way: if monthsDiff >= 4 (meaning 5th month or later, which is less than 8 months remaining)
    if (monthsDiff >= 4) {
      return res.status(400).json({ 
        error: `Garde-fou des 8 mois : Tunnel d'achat bloqué. L'activation a eu lieu le ${activatedAt.toLocaleDateString('fr-FR')} (${monthsDiff} mois écoulés). Toute nouvelle commande est interdite après 4 mois d'activité pour lisser les remboursements sur le cycle de 12 mois.`
      });
    }

    // 2. Fetch products and calculate total amount
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
        price: price
      });
    }

    // 3. Compute 1/3 - 2/3 splits
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

    // 4. Calculate monthly schedule
    const remainingMonths = 12 - monthsDiff;
    const monthlyPayment = creditPortion / remainingMonths;
    const paymentSchedule = [];

    for (let i = 0; i < remainingMonths; i++) {
      const dueDate = new Date(activatedAt);
      dueDate.setMonth(activatedAt.getMonth() + monthsDiff + i + 1); // Next month and onwards
      
      paymentSchedule.push({
        installment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: Number(monthlyPayment.toFixed(2)),
        paid: false,
        paid_at: null
      });
    }

    // 5. Run Database Transaction
    // Generate order number
    const orderNumber = 'GMD-' + Math.floor(100000 + Math.random() * 900000);

    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          company_id: companyId,
          order_number: orderNumber,
          total_amount: totalAmount,
          payment_schedule: paymentSchedule,
          status: 'APPROVED', // Auto approved as it matches parameters
          order_items: {
            create: orderItemsData.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });

      // Update Wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          acompte_restant: currentAcompte - acomptePortion,
          credit_utilise: currentCreditUsed + creditPortion
        }
      });

      return newOrder;
    });

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

    if (!transactionId) {
      return res.status(400).json({ error: 'Identifiant de transaction Kkiapay requis pour régler l\'échéance.' });
    }

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

    // Verify transaction via Kkiapay SDK
    const { kkiapay } = require("@kkiapay-org/nodejs-sdk");
    const k = kkiapay({
      privatekey: process.env.KKIAPAY_PRIVATE_KEY,
      publickey: process.env.KKIAPAY_PUBLIC_KEY,
      secretkey: process.env.KKIAPAY_SECRET_KEY,
      sandbox: process.env.KKIAPAY_SANDBOX === 'true'
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

    const verifiedAmount = parseFloat(verifyResponse.amount);
    const amountToPay = targetInstallment.amount;

    if (Math.abs(verifiedAmount - amountToPay) > 10) { // allow tiny variance
       return res.status(400).json({ error: `Montant de transaction incorrect. Requis: ${amountToPay} FCFA, Reçu: ${verifiedAmount} FCFA.` });
    }

    // Mark as paid
    targetInstallment.paid = true;
    targetInstallment.paid_at = new Date().toISOString();

    const amountPaid = targetInstallment.amount;

    await prisma.$transaction(async (tx) => {
      // Update Order
      await tx.order.update({
        where: { id: orderId },
        data: {
          payment_schedule: schedule
        }
      });

      // Credit the credit line back
      const wallet = order.company.wallet;
      const currentCreditUsed = Number(wallet.credit_utilise);
      const newCreditUsed = Math.max(0, currentCreditUsed - amountPaid);
      
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          credit_utilise: newCreditUsed
        }
      });
    });

    res.json({
      message: `Échéance N°${installmentNumber} payée avec succès (${amountPaid.toLocaleString()} FCFA). Ligne de crédit restaurée.`,
      payment_schedule: schedule
    });

  } catch (error) {
    console.error('Installment payment error:', error);
    res.status(500).json({ error: 'Erreur lors du paiement de l\'échéance.' });
  }
});

module.exports = router;
