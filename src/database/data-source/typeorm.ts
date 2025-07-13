import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();
const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    isProd
      ? join(__dirname, '..', '..', '**', 'entities', '*.entity.js')
      : join(__dirname, '..', '..', '**', 'entities', '*.entity.{ts,js}'),
  ],
  migrations: [
    isProd
      ? join(__dirname, '..', 'migrations', '*.js')
      : join(__dirname, '..', 'migrations', '*.{js,ts}'),
  ],
  synchronize: false,
  logging: isProd ? false : true,
});
