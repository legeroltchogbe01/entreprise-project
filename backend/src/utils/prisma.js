const { PrismaClient } = require('@prisma/client');

let prisma;

// Always use Neon Serverless Driver Adapter (both in local dev and prod) to bypass port 5432 blocking
console.log('[PRISMA] Using Neon Serverless Driver Adapter (WebSocket)...');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

// Configure WebSocket constructor for Neon serverless driver
neonConfig.webSocketConstructor = ws;

console.log('[PRISMA DEBUG] process.env.DATABASE_URL:', process.env.DATABASE_URL ? (process.env.DATABASE_URL.substring(0, 30) + '...') : 'UNDEFINED');
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.substring(1, connectionString.length - 1);
}
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

prisma = new PrismaClient({ adapter });

module.exports = prisma;
