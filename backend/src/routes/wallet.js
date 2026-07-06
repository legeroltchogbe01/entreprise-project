const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get wallet status
router.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { company_id: companyId },
      include: {
        company: {
          select: {
            denomination_sociale: true,
            kyc_status: true
          }
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Portefeuille introuvable.' });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Fetch wallet error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations du portefeuille.' });
  }
});

// Activate Wallet (Initial Recharge)
router.post('/activate/:id', async (req, res) => {
  try {
    const { id } = req.params; // wallet ID or company ID? Let's check company ID or wallet ID
    
    // Find wallet by company ID or wallet ID
    let wallet = await prisma.wallet.findFirst({
      where: {
        OR: [
          { id: id },
          { company_id: id }
        ]
      },
      include: { company: true }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Portefeuille introuvable.' });
    }

    if (wallet.company.kyc_status !== 'APPROVED') {
      return res.status(400).json({ error: 'L\'activation financière requiert l\'approbation préalable du KYC par l\'administration.' });
    }

    if (wallet.activated_at) {
      return res.status(400).json({ error: 'Ce portefeuille a déjà été activé financièrement.' });
    }

    // Set balances
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        acompte_initial: 5000000.00,
        acompte_restant: 5000000.00,
        credit_initial: 10000000.00,
        credit_utilise: 0.00,
        activated_at: new Date()
      }
    });

    res.json({
      message: 'Portefeuille activé avec succès. Apport initial de 5 000 000 FCFA reçu et ligne de crédit de 10 000 000 FCFA débloquée.',
      wallet: updatedWallet
    });

  } catch (error) {
    console.error('Wallet activation error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'activation financière du portefeuille.' });
  }
});

module.exports = router;
