import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'emails.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
  )
`);

try {
  db.exec(`ALTER TABLE emails ADD COLUMN deleted_at DATETIME NULL`);
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
  if (!errorMessage.includes('duplicate column name')) {
    console.warn('Avviso durante aggiornamento schema:', errorMessage);
  }
}

export interface EmailEntry {
  id?: number;
  email: string;
  created_at?: string;
  deleted_at?: string | null;
}

export class EmailDatabase {
  private insertEmail = db.prepare('INSERT INTO emails (email) VALUES (?)');
  private getAllEmails = db.prepare('SELECT * FROM emails WHERE deleted_at IS NULL ORDER BY created_at DESC');
  private getEmailCount = db.prepare('SELECT COUNT(*) as count FROM emails WHERE deleted_at IS NULL');
  private getAllEmailsIncludingDeleted = db.prepare('SELECT * FROM emails ORDER BY created_at DESC');
  private softDeleteEmail = db.prepare('UPDATE emails SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
  private restoreEmail = db.prepare('UPDATE emails SET deleted_at = NULL WHERE id = ?');
  private getEmailById = db.prepare('SELECT * FROM emails WHERE id = ?');

  addEmail(email: string): void {
    try {
      this.insertEmail.run(email);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email già registrata');
      }
      throw error;
    }
  }

  getEmails(): EmailEntry[] {
    return this.getAllEmails.all() as EmailEntry[];
  }

  getCount(): number {
    const result = this.getEmailCount.get() as { count: number };
    return result.count;
  }

  getEmailsIncludingDeleted(): EmailEntry[] {
    return this.getAllEmailsIncludingDeleted.all() as EmailEntry[];
  }

  deleteEmail(id: number): boolean {
    const result = this.softDeleteEmail.run(id);
    return result.changes > 0;
  }

  restoreEmail(id: number): boolean {
    const result = this.restoreEmail.run(id);
    return result.changes > 0;
  }

  getEmailById(id: number): EmailEntry | null {
    const result = this.getEmailById.get(id) as EmailEntry | undefined;
    return result || null;
  }

  getStats(): { active: number; deleted: number; total: number } {
    const activeCount = this.getEmailCount.get() as { count: number };
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM emails').get() as { count: number };

    return {
      active: activeCount.count,
      deleted: totalCount.count - activeCount.count,
      total: totalCount.count
    };
  }
}

export const emailDatabase = new EmailDatabase();
