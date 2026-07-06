const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Le nom et le prix du produit sont obligatoires.' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        image_url: image_url || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du produit.' });
  }
});

module.exports = router;
