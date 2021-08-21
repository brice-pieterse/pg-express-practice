import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const {
  TEST_DB_HOST,
  DEV_DB_HOST,
  DB_PASSWORD,
  DB_USERNAME,
  TEST_DB,
  DEV_DB,
  ENV
} = process.env;

let client: Pool;

if (ENV === 'TEST') {
  client = new Pool({
    host: TEST_DB_HOST,
    database: TEST_DB,
    password: DB_PASSWORD,
    user: DB_USERNAME
  });
} else {
  client = new Pool({
    host: DEV_DB_HOST,
    database: DEV_DB,
    password: DB_PASSWORD,
    user: DB_USERNAME
  });
}

export default client;
