const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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

// Multer configuration for Product image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'gmd_products',
      resource_type: 'image',
      public_id: 'product-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
    };
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || ext === '') {
      cb(null, true);
    } else {
      cb(new Error('Extension de fichier non autorisée (uniquement JPG, JPEG, PNG, WEBP).'));
    }
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du catalogue produits.' });
  }
});

// Create product (for Admin Back-office)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    let image_url = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80';

    if (req.file) {
      image_url = req.file.path;
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Le nom et le prix du produit sont obligatoires.' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        image_url
      }
    });

    res.status(201).json({ message: 'Produit ajouté avec succès.', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du produit.' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Delete image from Cloudinary here if it's stored there.
    // For now, we'll just delete the database record. Since OrderItem has onDelete: Cascade, 
    // deleting a product will cascade delete associated order items.

    await prisma.product.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
  }
});

module.exports = router;
