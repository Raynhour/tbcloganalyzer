import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private db!: Database.Database;
  private readonly ttlMs: number;

  private getStmt!: Database.Statement;
  private setStmt!: Database.Statement;
  private deleteStmt!: Database.Statement;
  private deleteByTagStmt!: Database.Statement;

  constructor(private readonly configService: ConfigService) {
    this.ttlMs =
      this.configService.get<number>('CACHE_TTL_MS') ?? DEFAULT_TTL_MS;
  }

  onModuleInit() {
    const dbDir = join(process.cwd(), '.cache');
    mkdirSync(dbDir, { recursive: true });

    const dbPath = join(dbDir, 'wcl-cache.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      )
    `);

    // Add tag column if it doesn't exist yet (migration for existing DBs)
    const cols = this.db
      .prepare(`PRAGMA table_info(cache)`)
      .all() as { name: string }[];
    if (!cols.some((c) => c.name === 'tag')) {
      this.db.exec('ALTER TABLE cache ADD COLUMN tag TEXT');
    }
    this.db.exec(
      'CREATE INDEX IF NOT EXISTS idx_cache_tag ON cache (tag)',
    );

    // Purge stale entries on startup
    const cutoff = Date.now() - this.ttlMs;
    const purged = this.db
      .prepare('DELETE FROM cache WHERE cached_at < ?')
      .run(cutoff);
    if (purged.changes > 0) {
      this.logger.log(`Purged ${purged.changes} stale cache entries`);
    }

    this.getStmt = this.db.prepare(
      'SELECT data, cached_at FROM cache WHERE key = ?',
    );
    this.setStmt = this.db.prepare(
      'INSERT OR REPLACE INTO cache (key, data, cached_at, tag) VALUES (?, ?, ?, ?)',
    );
    this.deleteStmt = this.db.prepare('DELETE FROM cache WHERE key = ?');
    this.deleteByTagStmt = this.db.prepare('DELETE FROM cache WHERE tag = ?');

    this.logger.log(
      `Cache initialized at ${dbPath} (TTL: ${this.ttlMs / 86400000}d)`,
    );
  }

  onModuleDestroy() {
    this.db?.close();
  }

  get<T>(key: string): T | null {
    const row = this.getStmt.get(key) as
      | { data: string; cached_at: number }
      | undefined;

    if (!row) return null;

    if (Date.now() - row.cached_at > this.ttlMs) {
      this.deleteStmt.run(key);
      return null;
    }

    return JSON.parse(row.data) as T;
  }

  set(key: string, data: unknown, tag?: string): void {
    this.setStmt.run(key, JSON.stringify(data), Date.now(), tag ?? null);
  }

  deleteByTag(tag: string): number {
    const result = this.deleteByTagStmt.run(tag);
    return result.changes;
  }
}
