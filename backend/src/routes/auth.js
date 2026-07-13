const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkAndDeactivateCompany } = require('../utils/autoDeactivate');
const { sendAccountCreatedEmail, sendAdminNewRegistrationEmail } = require('../utils/emailService');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
if (!process.env.CLOUDINARY_URL) {
  // Only explicitly configure if CLOUDINARY_URL is missing
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  // Parse CLOUDINARY_URL then force secure connection
  cloudinary.config(true);
  cloudinary.config({ secure: true });
}

const missingCloudinaryEnv = process.env.CLOUDINARY_URL
  ? []
  : ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      .filter(key => !process.env[key]);
if (missingCloudinaryEnv.length > 0) {
  throw new Error(`Cloudinary credentials missing: ${missingCloudinaryEnv.join(', ')}`);
}

// Multer configuration for Cloudinary uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'gmd_uploads',
      resource_type: 'auto', // Important to support pdf (image/raw) and webm (video)
      public_id: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
    };
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webm', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || ext === '') {
      cb(null, true);
    } else {
      cb(new Error('Extension de fichier non autorisée (uniquement PDF, JPG, JPEG, PNG, WEBM, MP4).'));
    }
  }
});

const uploadFields = upload.fields([
  { name: 'company_ifu_pdf', maxCount: 1 },
  { name: 'company_rccm_pdf', maxCount: 1 },
  { name: 'manager_cip_pdf', maxCount: 1 },
  { name: 'manager_selfie', maxCount: 1 },
  { name: 'manager_ifu_pdf', maxCount: 1 },
  { name: 'guarantor_cip_pdf', maxCount: 1 },
  { name: 'guarantor_selfie', maxCount: 1 },
  { name: 'guarantor_ifu_pdf', maxCount: 1 }
]);

// B2B registration
router.post('/register', uploadFields, async (req, res) => {
  try {
    const {
      denomination_sociale,
      rccm_number,
      ifu_number,
      phone,
      email,
      city,
      district,
      house,
      square,
      
      // Gérant
      manager_name,
      manager_rccm,
      manager_ifu,
      manager_phone,
      manager_email,
      manager_city,
      manager_district,
      manager_house,
      manager_square,

      // Avaliseur / Garant
      guarantor_name,
      guarantor_rccm,
      guarantor_ifu,
      guarantor_phone,
      guarantor_email,
      guarantor_city,
      guarantor_district,
      guarantor_house,
      guarantor_square
    } = req.body;

    // Check if fields are empty
    if (!denomination_sociale || !rccm_number || !ifu_number || !email || !phone) {
      return res.status(400).json({ error: 'Veuillez remplir toutes les informations d\'entreprise requises.' });
    }

    // Gérant validation
    if (!manager_name || !manager_ifu || !manager_phone || !manager_email || !manager_city || !manager_district || !manager_house || !manager_square) {
      return res.status(400).json({ error: 'Veuillez remplir toutes les informations obligatoires du Gérant.' });
    }

    // Avaliseur validation
    if (!guarantor_name || !guarantor_ifu || !guarantor_phone || !guarantor_email || !guarantor_city || !guarantor_district || !guarantor_house || !guarantor_square) {
      return res.status(400).json({ error: 'Veuillez remplir toutes les informations obligatoires de l\'Avaliseur (Garant).' });
    }

    // Normalize emails to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedManagerEmail = manager_email.toLowerCase().trim();
    const normalizedGuarantorEmail = guarantor_email.toLowerCase().trim();

    // IFU Validations (Benin IFU is exactly 13 characters)
    if (ifu_number.trim().length !== 13) {
      return res.status(400).json({ error: "Le numéro IFU de l'entreprise doit contenir exactement 13 caractères." });
    }
    if (manager_ifu.trim().length !== 13) {
      return res.status(400).json({ error: "Le numéro IFU du gérant doit contenir exactement 13 caractères." });
    }
    if (guarantor_ifu.trim().length !== 13) {
      return res.status(400).json({ error: "Le numéro IFU du garant doit contenir exactement 13 caractères." });
    }

    // RCCM Validation (Benin RCCM is between 12 and 15 characters)
    const rccmLength = rccm_number.trim().length;
    if (rccmLength < 12 || rccmLength > 15) {
      return res.status(400).json({ error: "Le numéro RCCM de l'entreprise doit contenir entre 12 et 15 caractères." });
    }

    // Phone Number Validations (Benin phone numbers are exactly 10 digits)
    const cleanPhone = phone.trim().replace(/\s/g, '');
    const cleanManagerPhone = manager_phone.trim().replace(/\s/g, '');
    const cleanGuarantorPhone = guarantor_phone.trim().replace(/\s/g, '');

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Le numéro de téléphone officiel de l'entreprise doit contenir exactement 10 chiffres." });
    }
    if (!/^\d{10}$/.test(cleanManagerPhone)) {
      return res.status(400).json({ error: "Le numéro de téléphone du gérant doit contenir exactement 10 chiffres." });
    }
    if (!/^\d{10}$/.test(cleanGuarantorPhone)) {
      return res.status(400).json({ error: "Le numéro de téléphone du garant doit contenir exactement 10 chiffres." });
    }

    // Check if email already exists
    const existing = await prisma.company.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return res.status(400).json({ error: 'Cette adresse email est déjà enregistrée.' });
    }

    // Check files
    if (!req.files || 
        !req.files.company_ifu_pdf ||
        !req.files.company_rccm_pdf ||
        !req.files.manager_cip_pdf || 
        !req.files.manager_selfie || 
        !req.files.manager_ifu_pdf ||
        !req.files.guarantor_cip_pdf || 
        !req.files.guarantor_selfie ||
        !req.files.guarantor_ifu_pdf) {
      return res.status(400).json({ error: 'Veuillez fournir toutes les pièces justificatives et documents requis (RCCM, IFU, CIP et Selfie KYC).' });
    }

    // Create Company
    const company = await prisma.company.create({
      data: {
        denomination_sociale,
        rccm_number: rccm_number.trim(),
        ifu_number: ifu_number.trim(),
        phone,
        email: normalizedEmail,
        city: city || '',
        district: district || '',
        house: house || '',
        square: square || '',
        company_ifu_pdf: req.files.company_ifu_pdf[0].path,
        company_rccm_pdf: req.files.company_rccm_pdf[0].path,
        
        // Gérant
        manager_name,
        manager_rccm: manager_rccm || '',
        manager_ifu: manager_ifu.trim(),
        manager_phone,
        manager_email: normalizedManagerEmail,
        manager_city,
        manager_district,
        manager_house,
        manager_square,
        manager_cip_pdf: req.files.manager_cip_pdf[0].path,
        manager_selfie: req.files.manager_selfie[0].path,
        manager_ifu_pdf: req.files.manager_ifu_pdf[0].path,
        
        // Avaliseur / Garant
        guarantor_name,
        guarantor_rccm: guarantor_rccm || '',
        guarantor_ifu: guarantor_ifu.trim(),
        guarantor_phone,
        guarantor_email: normalizedGuarantorEmail,
        guarantor_city,
        guarantor_district,
        guarantor_house,
        guarantor_square,
        guarantor_cip_pdf: req.files.guarantor_cip_pdf[0].path,
        guarantor_selfie: req.files.guarantor_selfie[0].path,
        guarantor_ifu_pdf: req.files.guarantor_ifu_pdf[0].path,
        
        kyc_status: 'PENDING'
      }
    });

    // Create inactive Wallet
    await prisma.wallet.create({
      data: {
        company_id: company.id,
        acompte_initial: 0,
        acompte_restant: 0,
        credit_initial: 0,
        credit_utilise: 0
      }
    });

    // ── Email de confirmation de réception du dossier (entreprise + gérant) ──
    const recipients = [normalizedEmail, normalizedManagerEmail].filter(Boolean).join(', ');
    sendAccountCreatedEmail({ to: recipients, denominationSociale: denomination_sociale })
      .then(() => console.log(`[REGISTER] Email de confirmation envoyé à : ${recipients}`))
      .catch(err => console.error('[REGISTER] Erreur email confirmation:', err.message));

    // ── Email notification administrateur GMD ──────────────────────────────────
    sendAdminNewRegistrationEmail({ company })
      .then(() => console.log(`[REGISTER] Email notification admin envoyé`))
      .catch(err => console.error('[REGISTER] Erreur email notification admin:', err.message));
    // ──────────────────────────────────────────────────────────────────────────

    res.status(201).json({
      message: 'Inscription enregistrée avec succès. Votre dossier de conformité est en attente d\'approbation.',
      companyId: company.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription: ' + error.message });
  }
});

// Simple B2B / Admin login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Veuillez fournir une adresse email.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Special admin email
    if (normalizedEmail === 'admin@gmd.bj' || normalizedEmail === 'admin@gmd.com') {
      return res.json({
        role: 'ADMIN',
        user: {
          email: normalizedEmail,
          name: 'Administrateur GMD'
        }
      });
    }

    let company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Aucun compte entreprise associé à cette adresse email.' });
    }

    // Run the check & potential deactivation
    const checkedCompany = await checkAndDeactivateCompany(company.id);
    if (checkedCompany) {
      company = checkedCompany;
    }

    res.json({
      role: 'CLIENT',
      company: company
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// Get company details by ID
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: { wallet: true }
    });
    if (!company) {
      return res.status(404).json({ error: 'Entreprise introuvable.' });
    }
    res.json(company);
  } catch (error) {
    console.error('Fetch company error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
});

module.exports = router;
