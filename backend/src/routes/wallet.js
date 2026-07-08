const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get wallet status
router.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    let wallet = await prisma.wallet.findUnique({
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
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        return res.status(404).json({ error: 'Portefeuille introuvable (entreprise non trouvée).' });
      }
      // Dynamically create the missing wallet
      wallet = await prisma.wallet.create({
        data: {
          company_id: companyId,
          acompte_initial: 0,
          acompte_restant: 0,
          credit_initial: 0,
          credit_utilise: 0
        },
        include: {
          company: {
            select: {
              denomination_sociale: true,
              kyc_status: true
            }
          }
        }
      });
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

    // Set balances based on global SystemSetting
    const minActivationSetting = await prisma.systemSetting.findUnique({
      where: { key: 'MIN_ACTIVATION_DEPOSIT' }
    });
    const acompte = minActivationSetting ? parseFloat(minActivationSetting.value) : 5000000.00;
    const credit = acompte * 2.0;

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        acompte_initial: acompte,
        acompte_restant: acompte,
        credit_initial: credit,
        credit_utilise: 0.00,
        activated_at: new Date()
      }
    });

    res.json({
      message: `Portefeuille activé avec succès. Apport initial de ${acompte.toLocaleString('fr-FR')} FCFA reçu (1/3) et ligne de crédit de ${credit.toLocaleString('fr-FR')} FCFA débloquée (2/3).`,
      wallet: updatedWallet
    });

  } catch (error) {
    console.error('Wallet activation error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'activation financière du portefeuille.' });
  }
});

// Recharge Wallet via Kkiapay (Adds to acompte_restant and acompte_initial)
router.post('/recharge', async (req, res) => {
  try {
    const { companyId, transactionId, amount } = req.body;

    if (!companyId || !transactionId || !amount) {
      return res.status(400).json({ error: 'Informations de rechargement incomplètes.' });
    }

    // 1. Verify transaction via Kkiapay SDK
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
    if (Math.abs(verifiedAmount - parseFloat(amount)) > 10) { // Allow tiny variance due to conversion or processing fee if any
      return res.status(400).json({ error: `Montant de la transaction incohérent. Requis: ${amount} FCFA, Reçu: ${verifiedAmount} FCFA.` });
    }

    // 2. Fetch company and wallet
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' });
    }

    let wallet = company.wallet;
    if (!wallet) {
      // Create wallet if it somehow doesn't exist
      wallet = await prisma.wallet.create({
        data: {
          company_id: companyId,
          acompte_initial: 0,
          acompte_restant: 0,
          credit_initial: 0,
          credit_utilise: 0
        }
      });
    }

    // 3. Update balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        acompte_initial: Number(wallet.acompte_initial) + verifiedAmount,
        acompte_restant: Number(wallet.acompte_restant) + verifiedAmount
      }
    });

    res.json({
      message: `Votre portefeuille a été approvisionné de ${verifiedAmount.toLocaleString('fr-FR')} FCFA avec succès.`,
      wallet: updatedWallet
    });

  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({ error: 'Erreur interne lors du rechargement de votre portefeuille.' });
  }
});

module.exports = router;
