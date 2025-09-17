// backend/knexfile.js (FINAL AND CORRECT CODE)

// Load environment variables from the root .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  /**
   * Development environment configuration (for your local machine with MySQL)
   */
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'stabylink_db',
    },
    migrations: {
      directory: './db/migrations'
    }
  },

  /**
   * Production environment configuration (for Render.com with PostgreSQL)
   */
  production: {
    client: 'pg', // Change client to 'pg' for PostgreSQL
    connection: {
      // Render provides the connection string in the DATABASE_URL env var
      connectionString: process.env.DATABASE_URL,
      // Render's PostgreSQL instances require SSL, but not with cert verification
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './db/migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};