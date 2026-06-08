import 'dotenv/config'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from './schema.js'

const dbPath = process.env.DATABASE_URL || './data/gestor_nfse.sqlite'
mkdirSync(dirname(dbPath), { recursive: true })
const sqliteDb = new Database(dbPath)
sqliteDb.pragma('journal_mode = WAL')
sqliteDb.pragma('foreign_keys = ON')

export const db = drizzle(sqliteDb, { schema })

export function closeDb() {
  sqliteDb.close()
}
