const { Pool } = require('pg');

// Connection pool — optimized for local-first high-speed operations
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'atlas_erp_local',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), NOW() as server_time');
    console.log(`✅ Database connected: ${result.rows[0].current_database} | Server time: ${result.rows[0].server_time}`);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

// Helper: execute a query with parameters
const query = (text, params) => pool.query(text, params);

// Helper: get a client from the pool (for transactions)
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
