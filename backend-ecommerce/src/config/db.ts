import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction =
  process.env.NODE_ENV === 'production';

const databaseUrl =
  process.env.DATABASE_URL;

export const pool =
  databaseUrl
    ? new Pool({
        connectionString:
          databaseUrl,

        ssl: isProduction
          ? {
              rejectUnauthorized: false
            }
          : undefined
      })
    : new Pool({
        user:
          process.env.DB_USER,

        host:
          process.env.DB_HOST,

        database:
          process.env.DB_NAME,

        password:
          process.env.DB_PASSWORD,

        port:
          Number(
            process.env.DB_PORT
          ) || 5432
      });
