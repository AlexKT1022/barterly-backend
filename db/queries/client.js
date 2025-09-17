import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/barterly';

export const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected pg error', err);
  process.exit(-1);
});

const db = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};

export default db;
