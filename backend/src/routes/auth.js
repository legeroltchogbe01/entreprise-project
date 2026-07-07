const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
const cloudinaryConfig = process.env.CLOUDINARY_URL
  ? { cloudinary_url: process.env.CLOUDINARY_URL, secure: true }
  : {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    };

const missingCloudinaryEnv = process.env.CLOUDINARY_URL
  ? []
  : ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      .filter(key => !process.env[key]);
if (missingCloudinaryEnv.length > 0) {
  throw new Error(`Cloudinary credentials missing: ${missingCloudinaryEnv.join(', ')}`);
}

cloudinary.config(cloudinaryConfig);

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
  { name: 'manager_cip_pdf', maxCount: 1 },
  { name: 'manager_selfie', maxCount: 1 },
  { name: 'guarantor_cip_pdf', maxCount: 1 },
  { name: 'guarantor_selfie', maxCount: 1 }
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

    // Check if email already exists
    const existing = await prisma.company.findUnique({
      where: { email }
    });
    if (existing) {
      return res.status(400).json({ error: 'Cette adresse email est déjà enregistrée.' });
    }

    // Check files
    if (!req.files || 
        !req.files.manager_cip_pdf || 
        !req.files.manager_selfie || 
        !req.files.guarantor_cip_pdf || 
        !req.files.guarantor_selfie) {
      return res.status(400).json({ error: 'Veuillez fournir toutes les pièces d\'identité et clichés requis (CIP + Selfie pour le gérant et le garant).' });
    }

    // Create Company
    const company = await prisma.company.create({
      data: {
        denomination_sociale,
        rccm_number,
        ifu_number,
        phone,
        email,
        city: city || '',
        district: district || '',
        house: house || '',
        square: square || '',
        
        // Gérant
        manager_name,
        manager_rccm: manager_rccm || '',
        manager_ifu,
        manager_phone,
        manager_email,
        manager_city,
        manager_district,
        manager_house,
        manager_square,
        manager_cip_pdf: req.files.manager_cip_pdf[0].path,
        manager_selfie: req.files.manager_selfie[0].path,
        
        // Avaliseur / Garant
        guarantor_name,
        guarantor_rccm: guarantor_rccm || '',
        guarantor_ifu,
        guarantor_phone,
        guarantor_email,
        guarantor_city,
        guarantor_district,
        guarantor_house,
        guarantor_square,
        guarantor_cip_pdf: req.files.guarantor_cip_pdf[0].path,
        guarantor_selfie: req.files.guarantor_selfie[0].path,
        
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

    // Special admin email
    if (email === 'admin@gmd.bj' || email === 'admin@gmd.com') {
      return res.json({
        role: 'ADMIN',
        user: {
          email,
          name: 'Administrateur GMD'
        }
      });
    }

    const company = await prisma.company.findUnique({
      where: { email },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Aucun compte entreprise associé à cette adresse email.' });
    }

    res.json({
      role: 'CLIENT',
      company: {
        id: company.id,
        denomination_sociale: company.denomination_sociale,
        email: company.email,
        kyc_status: company.kyc_status,
        wallet: company.wallet
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
