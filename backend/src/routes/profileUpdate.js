const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { sendProfileUpdateApprovedEmail, sendProfileUpdateRejectedEmail, sendAdminProfileUpdateSubmittedEmail } = require('../utils/emailService');

// Fields that the client is allowed to request changes for
const ALLOWED_FIELDS = [
  'phone', 'city', 'district', 'house', 'square',
  'manager_name', 'manager_phone', 'manager_email',
  'manager_city', 'manager_district', 'manager_house', 'manager_square',
  'guarantor_name', 'guarantor_phone', 'guarantor_email',
  'guarantor_city', 'guarantor_district', 'guarantor_house', 'guarantor_square',
];

// ── ADMIN routes MUST come before /:companyId to avoid param conflicts ────────

// ADMIN: List all pending profile update requests
router.get('/admin/pending', async (req, res) => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      where: { status: 'PENDING' },
      include: { company: { select: { id: true, denomination_sociale: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('ProfileUpdate admin list error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes.' });
  }
});

// ADMIN: List ALL profile update requests
router.get('/admin/all', async (req, res) => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      include: { company: { select: { id: true, denomination_sociale: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('ProfileUpdate admin all error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes.' });
  }
});

// ADMIN: Approve a profile update request
router.post('/admin/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { admin_note } = req.body;

    const request = await prisma.profileUpdateRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée.' });
    }

    // Apply changes to the company record
    const changes = request.changes;
    await prisma.company.update({
      where: { id: request.company_id },
      data: changes,
    });

    // Mark request as approved
    const updated = await prisma.profileUpdateRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', admin_note: admin_note || null },
      include: { company: true },
    });

    // ── Email notification ────────────────────────────────────────────
    const co = updated.company;
    const emailTo = [co.email, co.manager_email].filter(Boolean).join(', ');
    sendProfileUpdateApprovedEmail({
      to: emailTo,
      denominationSociale: co.denomination_sociale,
      changes,
      adminNote: admin_note || null
    }).catch(err => console.error('[PROFILE_UPDATE] Erreur email approbation:', err.message));
    // ─────────────────────────────────────────────────────────────────────

    res.json({ message: 'Demande approuvée et profil mis à jour.', request: updated });
  } catch (error) {
    console.error('ProfileUpdate approve error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la demande.' });
  }
});

// ADMIN: Reject a profile update request
router.post('/admin/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { admin_note } = req.body;

    const request = await prisma.profileUpdateRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée.' });
    }

    const updated = await prisma.profileUpdateRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', admin_note: admin_note || null },
      include: { company: true },
    });

    // ── Email notification ────────────────────────────────────────────
    const co = updated.company;
    const emailTo = [co.email, co.manager_email].filter(Boolean).join(', ');
    sendProfileUpdateRejectedEmail({
      to: emailTo,
      denominationSociale: co.denomination_sociale,
      adminNote: admin_note || null
    }).catch(err => console.error('[PROFILE_UPDATE] Erreur email rejet:', err.message));
    // ─────────────────────────────────────────────────────────────────────

    res.json({ message: 'Demande rejetée.', request: updated });
  } catch (error) {
    console.error('ProfileUpdate reject error:', error);
    res.status(500).json({ error: 'Erreur lors du rejet de la demande.' });
  }
});

// ── CLIENT routes ─────────────────────────────────────────────────────────────

// CLIENT: Get all requests for a company
router.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const requests = await prisma.profileUpdateRequest.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('ProfileUpdate list error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes.' });
  }
});

// CLIENT: Submit a profile update request
router.post('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { changes } = req.body;

    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) {
      return res.status(400).json({ error: 'Aucune modification à soumettre.' });
    }

    // Sanitize: only keep allowed fields
    const sanitized = {};
    for (const key of Object.keys(changes)) {
      if (ALLOWED_FIELDS.includes(key) && changes[key] !== '' && changes[key] !== null) {
        sanitized[key] = changes[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ error: 'Aucune modification valide détectée.' });
    }

    // Check if there's already a pending request
    const existing = await prisma.profileUpdateRequest.findFirst({
      where: { company_id: companyId, status: 'PENDING' }
    });

    if (existing) {
      return res.status(409).json({ error: 'Vous avez déjà une demande de modification en attente d\'approbation.' });
    }

    const request = await prisma.profileUpdateRequest.create({
      data: {
        company_id: companyId,
        changes: sanitized,
      },
      include: { company: true }
    });

    // ── Email notification admin pour demande de modification de profil ──
    sendAdminProfileUpdateSubmittedEmail({
      company: request.company,
      changes: sanitized
    }).catch(err => console.error('[PROFILE_UPDATE] Erreur email notification admin:', err.message));
    // ─────────────────────────────────────────────────────────────────────

    res.status(201).json(request);
  } catch (error) {
    console.error('ProfileUpdate submit error:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission de la demande.' });
  }
});

module.exports = router;
