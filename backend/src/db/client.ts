import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getDatabaseUrl } from '../config/env.js'

export const pool = new Pool({ connectionString: getDatabaseUrl() })
export const db = drizzle({ client: pool })
