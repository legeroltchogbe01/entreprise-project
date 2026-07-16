/**
 * Prisma Client - Production Hostinger/CloudLinux Safe Version
 *
 * Problème connu : Le moteur Rust de Prisma (library engine / binary engine)
 * panique sur Hostinger CloudLinux ("timer has gone away").
 *
 * Solution : Utiliser @prisma/adapter-pg qui bypasse totalement le moteur Rust
 * et utilise le driver TCP standard node-postgres (pg) pour communiquer avec Neon.
 * Compatible avec toutes les plateformes (Hostinger, VPS, local, etc.)
 *
 * Prérequis schema.prisma :
 *   previewFeatures = ["driverAdapters"]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('[PRISMA] DATABASE_URL manquant dans les variables d\'environnement.');
}

// Pool TCP standard (node-postgres) - fonctionne partout, aucun moteur Rust nécessaire
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Neon exige SSL, on accepte son certificat auto-signé
  max: 2,                             // Limite Neon free tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

console.log('[PRISMA] Client initialisé avec @prisma/adapter-pg (driver TCP, moteur Rust bypassé).');

module.exports = prisma;
