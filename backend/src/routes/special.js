const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { sendQuoteReadyEmail } = require('../utils/emailService');

// Configure Cloudinary
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  cloudinary.config(true);
  cloudinary.config({ secure: true });
}

// Multer/Cloudinary for model image uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'gmd_special_requests',
    resource_type: 'image',
    public_id: 'model-' + Date.now() + '-' + Math.round(Math.random() * 1e9)
  })
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Format non autorisé (JPG, PNG, WEBP).'));
  }
});

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
router.post('/', upload.single('image'), async (req, res) => {
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
        status: { not: 'REJECTED' }
      }
    });

    const currentWeekTotal = recentRequests.reduce((sum, req) => sum + req.quantity, 0);

    if (currentWeekTotal + qty > 30) {
      return res.status(400).json({
        error: `Plafond hebdomadaire dépassé. Vous avez soumis ${currentWeekTotal} articles ces 7 derniers jours (Limite max: 30 articles/semaine). Quantité restante autorisée: ${30 - currentWeekTotal} articles.`
      });
    }

    // 2. Image URL (from Cloudinary if uploaded)
    const image_url = req.file ? req.file.path : null;

    // 3. Create request
    const request = await prisma.specialRequest.create({
      data: {
        company_id: companyId,
        description,
        quantity: qty,
        image_url,
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
    const { quoteItems, quoteNotes } = req.body; // quoteItems: Array of { article, price, quantity, total }

    if (!quoteItems || !Array.isArray(quoteItems) || quoteItems.length === 0) {
      return res.status(400).json({ error: 'Veuillez saisir au moins une ligne d\'article pour le devis.' });
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

    // Calculate total price: Sum of (quantity * price) for each item
    const computedTotal = quoteItems.reduce((sum, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseInt(item.quantity) || 0;
      return sum + (p * q);
    }, 0);

    const defaultContract = `CONTRAT DE VENTE ET FINANCEMENT SUR-MESURE\n\n` +
      `Entre la société GMD Créance d'une part, et l'entreprise ${request.id.slice(0, 8)} d'autre part.\n\n` +
      `Objet : Vente de mobilier sur-mesure d'un montant total de ${computedTotal.toLocaleString('fr-FR')} FCFA.\n` +
      `Paiement : 1/3 d'acompte (${(computedTotal / 3).toLocaleString('fr-FR')} FCFA) et 2/3 à crédit échelonné.\n\n` +
      `Fait à Cotonou, le ${new Date().toLocaleDateString('fr-FR')}`;

    const updated = await prisma.specialRequest.update({
      where: { id },
      data: {
        estimated_price: computedTotal,
        quote_items: quoteItems,
        quote_notes: quoteNotes || '',
        contract_content: defaultContract,
        status: 'QUOTED'
      },
      include: { company: true }
    });

    // ── Email devis prêt ─────────────────────────────────────────────
    const co = updated.company;
    const emailTo = [co.email, co.manager_email].filter(Boolean).join(', ');
    sendQuoteReadyEmail({
      to: emailTo,
      denominationSociale: co.denomination_sociale,
      requestDescription: request.description,
      totalAmount: computedTotal,
      quoteItems
    }).catch(err => console.error('[QUOTE] Erreur email devis:', err.message));
    // ───────────────────────────────────────────────────────────────────

    res.json({
      message: 'Devis et contrat initial émis avec succès au client.',
      request: updated
    });

  } catch (error) {
    console.error('Submit quote error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du devis.' });
  }
});

// Admin update/customize contract
router.post('/:id/contract', async (req, res) => {
  try {
    const { id } = req.params;
    const { contractContent } = req.body;

    if (!contractContent) {
      return res.status(400).json({ error: 'Le contenu du contrat ne peut pas être vide.' });
    }

    const request = await prisma.specialRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande spéciale introuvable.' });
    }

    const updated = await prisma.specialRequest.update({
      where: { id },
      data: {
        contract_content: contractContent
      }
    });

    res.json({
      message: 'Contrat personnalisé avec succès.',
      request: updated
    });

  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Erreur lors de la personnalisation du contrat.' });
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
