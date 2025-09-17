// backend/src/config/db.config.js

const path = require('path');
// --- समाधान: dotenv को केवल यहीं पर, एक बार लोड करें ---
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') }); // रूट .env तक का सही पाथ
}

const knex = require('knex');
// --- ❌ गलत लाइन ---
// const knexfile = require('../../../knexfile'); 

// --- ✅ सही लाइन ---
const knexfile = require('../../knexfile'); // knexfile तक का सही पाथ (config -> src -> backend)

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

console.log(`[DB] Initializing database connection for '${environment}' environment.`);
const db = knex(config);

db.raw('SELECT 1')
  .then(() => {
    console.log('[DB] Database connection successful.');
  })
  .catch((err) => {
    console.error('[DB] FATAL: Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;