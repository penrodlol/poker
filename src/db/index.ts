import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

export * from './schema.ts';
export default drizzle(env.DB, { schema });
