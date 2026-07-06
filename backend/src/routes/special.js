const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all requests (Admin)
router.get('/', async (req, res) => {
  try {
    const requests = await prisma.specialRequest.findMany({
      include: { company: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('Fetch all special requests error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des demandes spéciales.' });
  }
});

// Get client requests
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const requests = await prisma.specialRequest.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('Fetch company special requests error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de vos demandes spéciales.' });
  }
});

// Submit custom/sur-mesure request (Checks 30 items/week limit)
router.post('/', async (req, res) => {
  try {
    const { companyId, description, quantity } = req.body;

    if (!companyId || !description || !quantity) {
      return res.status(400).json({ error: 'Veuillez renseigner la description et la quantité.' });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: 'La quantité doit être supérieure à zéro.' });
    }

    // 1. Quota check: max 30 items per week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentRequests = await prisma.specialRequest.findMany({
      where: {
        company_id: companyId,
        created_at: { gte: oneWeekAgo },
        status: { not: 'REJECTED' } // Do not count rejected requests
      }
    });

    const currentWeekTotal = recentRequests.reduce((sum, req) => sum + req.quantity, 0);

    if (currentWeekTotal + qty > 30) {
      return res.status(400).json({
        error: `Plafond hebdomadaire dépassé. Vous avez soumis ${currentWeekTotal} articles ces 7 derniers jours (Limite max: 30 articles/semaine). Quantité restante autorisée: ${30 - currentWeekTotal} articles.`
      });
    }

    // 2. Create request
    const request = await prisma.specialRequest.create({
      data: {
        company_id: companyId,
        description,
        quantity: qty,
        status: 'SUBMITTED'
      }
    });

    res.status(201).json({
      message: 'Demande spéciale soumise avec succès. L\'administration GMD émettra un devis sous 48h.',
      request
    });

  } catch (error) {
    console.error('Submit special request error:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission de la demande.' });
  }
});

// Admin submit quote
router.post('/:id/quote', async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedPrice } = req.body;

    if (!estimatedPrice) {
      return res.status(400).json({ error: 'Veuillez saisir un prix pour le devis.' });
    }

    const request = await prisma.specialRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande spéciale introuvable.' });
    }

    if (request.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Ce devis a déjà été traité.' });
    }

    const updated = await prisma.specialRequest.update({
      where: { id },
      data: {
        estimated_price: parseFloat(estimatedPrice),
        status: 'QUOTED'
      }
    });

    res.json({
      message: 'Devis envoyé avec succès au client.',
      request: updated
    });

  } catch (error) {
    console.error('Submit quote error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du devis.' });
  }
});

// Client approve quote (Creates Order & applies wallet rules + 8-month veto)
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.specialRequest.findUnique({
      where: { id },
      include: { company: { include: { wallet: true } } }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande spéciale introuvable.' });
    }

    if (request.status !== 'QUOTED') {
      return res.status(400).json({ error: 'Cette demande n\'est pas au statut "Devis Émis".' });
    }

    const company = request.company;
    const wallet = company.wallet;

    if (!wallet || !wallet.activated_at) {
      return res.status(400).json({ error: 'Votre portefeuille n\'est pas activé financièrement.' });
    }

    // 1. Check 8-Month Safeguard Veto Rule
    const activatedAt = new Date(wallet.activated_at);
    const now = new Date();
    let monthsDiff = (now.getFullYear() - activatedAt.getFullYear()) * 12 + now.getMonth() - activatedAt.getMonth();
    if (now.getDate() < activatedAt.getDate() && monthsDiff > 0) {
      monthsDiff--;
    }

    if (monthsDiff >= 4) {
      return res.status(400).json({ 
        error: `Garde-fou des 8 mois : Tunnel d'achat bloqué. L'activation a eu lieu le ${activatedAt.toLocaleDateString('fr-FR')} (${monthsDiff} mois écoulés). Toute nouvelle commande est interdite à moins de 8 mois du terme du cycle annuel.`
      });
    }

    const totalAmount = Number(request.estimated_price);
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

    // 2. Calculate monthly schedule
    const remainingMonths = 12 - monthsDiff;
    const monthlyPayment = creditPortion / remainingMonths;
    const paymentSchedule = [];

    for (let i = 0; i < remainingMonths; i++) {
      const dueDate = new Date(activatedAt);
      dueDate.setMonth(activatedAt.getMonth() + monthsDiff + i + 1);
      
      paymentSchedule.push({
        installment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: Number(monthlyPayment.toFixed(2)),
        paid: false,
        paid_at: null
      });
    }

    // 3. Run Database Transaction
    // Create product placeholder for custom furniture
    const customProduct = await prisma.product.create({
      data: {
        name: `Commande Sur-mesure (Ref: ${request.id.slice(0,8)})`,
        description: request.description,
        price: totalAmount,
        image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80'
      }
    });

    const orderNumber = 'GMD-SP-' + Math.floor(100000 + Math.random() * 900000);

    await prisma.$transaction(async (tx) => {
      // Create Order
      await tx.order.create({
        data: {
          company_id: request.company_id,
          order_number: orderNumber,
          total_amount: totalAmount,
          payment_schedule: paymentSchedule,
          status: 'APPROVED',
          order_items: {
            create: {
              product_id: customProduct.id,
              quantity: request.quantity,
              price: totalAmount
            }
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

      // Update request status
      await tx.specialRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED' }
      });
    });

    res.json({
      message: 'Devis approuvé et commande générée avec succès.'
    });

  } catch (error) {
    console.error('Approve quote error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation du devis : ' + error.message });
  }
});

module.exports = router;
