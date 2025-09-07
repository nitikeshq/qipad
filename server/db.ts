import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pkg;

// Local PostgreSQL configuration
const connectionConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'qipaddb',
  user: 'postgres',
  password: 'Octamy#1234',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });