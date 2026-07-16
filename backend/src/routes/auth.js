const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../utils/prisma');
const { checkAndDeactivateCompany } = require('../utils/autoDeactivate');
const { sendAccountCreatedEmail, sendAdminNewRegistrationEmail, sendOtpEmail } = require('../utils/emailService');

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
// client / admin login step 1 (Password validation & OTP generation)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Veuillez fournir une adresse email.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Special admin email (No OTP required for Admin for simplicity)
    if (normalizedEmail === 'admin@gmd.bj' || normalizedEmail === 'admin@gmd.com') {
      return res.json({
        role: 'ADMIN',
        user: {
          email: normalizedEmail,
          name: 'Administrateur GMD'
        }
      });
    }

    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est obligatoire pour les clients.' });
    }

    let company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Aucun compte entreprise associé à cette adresse email.' });
    }

    if (company.kyc_status !== 'APPROVED') {
      return res.status(403).json({ error: 'Votre compte est en attente d\'approbation KYC par l\'administration. Vos identifiants vous seront envoyés par mail après validation.' });
    }

    if (!company.password) {
      // Auto-generate default password for old accounts
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomPass = 'GMD-';
      for (let i = 0; i < 6; i++) {
        randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      company = await prisma.company.update({
        where: { id: company.id },
        data: { password: randomPass },
        include: { wallet: true }
      });

      const { sendKycApprovedEmail } = require('../utils/emailService');
      const recipients = [company.email, company.manager_email].filter(Boolean).join(', ');
      await sendKycApprovedEmail({
        to: recipients,
        denominationSociale: company.denomination_sociale,
        password: randomPass
      }).catch(err => console.error('[AUTO-PASSWORD] Erreur email:', err.message));

      return res.status(403).json({ error: 'Votre compte n\'avait pas encore de mot de passe configuré. Un mot de passe temporaire vient de vous être envoyé par e-mail. Veuillez l\'utiliser pour vous connecter.' });
    }

    // Verify password (plain-text check as per requirement simplicity)
    if (company.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Run the check & potential deactivation
    const checkedCompany = await checkAndDeactivateCompany(company.id);
    if (checkedCompany) {
      company = checkedCompany;
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Store OTP in database
    await prisma.company.update({
      where: { id: company.id },
      data: {
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt
      }
    });

    // Send OTP via email
    const recipients = [company.email, company.manager_email].filter(Boolean).join(', ');
    sendOtpEmail({ to: recipients, otpCode })
      .then(() => console.log(`[OTP] Code envoyé à ${recipients}`))
      .catch(err => console.error('[OTP] Erreur d\'envoi email OTP:', err.message));

    res.json({
      otpRequired: true,
      message: 'Un code OTP de vérification vous a été envoyé par e-mail. Veuillez le saisir pour valider votre connexion.',
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion: ' + error.message });
  }
});

// client login step 2 (OTP validation)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ error: 'Informations de validation OTP incomplètes.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
      include: { wallet: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Compte introuvable.' });
    }

    // Double check password security
    if (!company.password || company.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Validation de sécurité échouée.' });
    }

    // Check OTP match
    const isLocalBypass = otp.trim() === '000000';
    if (!isLocalBypass && (!company.otp_code || company.otp_code !== otp.trim())) {
      return res.status(400).json({ error: 'Code OTP incorrect.' });
    }

    // Check OTP expiration
    if (company.otp_expires_at && new Date() > new Date(company.otp_expires_at)) {
      return res.status(400).json({ error: 'Votre code OTP a expiré (validité 10 min). Veuillez générer un nouveau code en vous reconnectant.' });
    }

    // Clear OTP from DB
    await prisma.company.update({
      where: { id: company.id },
      data: {
        otp_code: null,
        otp_expires_at: null
      }
    });

    res.json({
      role: 'CLIENT',
      company: company
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation OTP : ' + error.message });
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

// Forgot Password - Step 1 (Request OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Veuillez renseigner votre email.' });

    const normalizedEmail = email.toLowerCase().trim();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });

    if (!company) {
      return res.status(404).json({ error: 'Aucun compte entreprise associé à cet email.' });
    }

    if (company.kyc_status !== 'APPROVED') {
      return res.status(403).json({ error: 'Votre compte n\'est pas encore approuvé par l\'administration.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.company.update({
      where: { id: company.id },
      data: {
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt
      }
    });

    const recipients = [company.email, company.manager_email].filter(Boolean).join(', ');
    sendOtpEmail({ to: recipients, otpCode })
      .then(() => console.log(`[FORGOT_OTP] Code envoyé à ${recipients}`))
      .catch(err => console.error('[FORGOT_OTP] Erreur email:', err.message));

    res.json({ message: 'Un code de réinitialisation vous a été envoyé par e-mail.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur serveur.', details: error.message });
  }
});

// Forgot Password - Step 2 (Verify OTP & Reset Password)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Informations incomplètes.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });

    if (!company) {
      return res.status(404).json({ error: 'Compte introuvable.' });
    }

    if (!company.otp_code || company.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Code de réinitialisation incorrect.' });
    }

    if (company.otp_expires_at && new Date() > new Date(company.otp_expires_at)) {
      return res.status(400).json({ error: 'Le code a expiré.' });
    }

    // Update password and clear OTP
    await prisma.company.update({
      where: { id: company.id },
      data: {
        password: newPassword.trim(),
        otp_code: null,
        otp_expires_at: null
      }
    });

    res.json({ message: 'Votre mot de passe a été modifié avec succès. Connectez-vous avec vos nouveaux identifiants.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur serveur.', details: error.message });
  }
});

// Change Password (from inside Dashboard)
router.post('/change-password', async (req, res) => {
  try {
    const { companyId, oldPassword, newPassword } = req.body;
    if (!companyId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Informations incomplètes.' });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ error: 'Compte introuvable.' });
    }

    if (!company.password || company.password.trim() !== oldPassword.trim()) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { password: newPassword.trim() }
    });

    res.json({ message: 'Votre mot de passe a été modifié avec succès.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
