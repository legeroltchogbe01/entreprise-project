const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function testPgAdapter() {
  console.log('--- TEST: @prisma/adapter-pg (TCP standard, zero Rust engine) ---');
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log('DATABASE_URL défini:', !!connectionString);

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 2,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ @prisma/adapter-pg SUCCESS:', result);

    await prisma.$disconnect();
    await pool.end();
  } catch (err) {
    console.error('❌ @prisma/adapter-pg FAILED:', err.message || err);
    process.exit(1);
  }
}

testPgAdapter();
