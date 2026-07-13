const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  console.log('[PRISMA] Running in production mode - Using Neon Serverless Driver Adapter...');
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { PrismaNeon } = require('@prisma/adapter-neon');
  const ws = require('ws');

  // Configure WebSocket constructor for Neon serverless driver
  neonConfig.webSocketConstructor = ws;

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  
  prisma = new PrismaClient({ adapter });
} else {
  console.log('[PRISMA] Running in development mode - Using standard Prisma Client...');
  prisma = new PrismaClient();
}

module.exports = prisma;
