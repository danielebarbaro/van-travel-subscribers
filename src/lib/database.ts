import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;

  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      )
    `);

    const tableInfo = await turso.execute("PRAGMA table_info(emails)");
    const hasDeletedAt = tableInfo.rows.some((row) => {
      const rowData = row as Record<string, unknown>;
      return rowData.name === 'deleted_at';
    });

    if (!hasDeletedAt) {
      await turso.execute(`ALTER TABLE emails ADD COLUMN deleted_at DATETIME NULL`);
    }

    isInitialized = true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.warn('Avviso durante inizializzazione database:', errorMessage);
  }
}

initializeDatabase().catch(console.error);

export interface EmailEntry {
  id?: number;
  email: string;
  created_at?: string;
  deleted_at?: string | null;
}

export class EmailDatabase {
  private async ensureInitialized() {
    if (!isInitialized) {
      await initializeDatabase();
    }
  }

  async addEmail(email: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await turso.execute({
        sql: 'INSERT INTO emails (email) VALUES (?)',
        args: [email]
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email già registrata');
      }
      throw error;
    }
  }

  async getEmails(): Promise<EmailEntry[]> {
    await this.ensureInitialized();
    const result = await turso.execute('SELECT * FROM emails WHERE deleted_at IS NULL ORDER BY created_at DESC');
    return result.rows as unknown as EmailEntry[];
  }

  async getCount(): Promise<number> {
    await this.ensureInitialized();
    const result = await turso.execute('SELECT COUNT(*) as count FROM emails WHERE deleted_at IS NULL');
    return (result.rows[0] as unknown as { count: number }).count;
  }

  async getEmailsIncludingDeleted(): Promise<EmailEntry[]> {
    await this.ensureInitialized();
    const result = await turso.execute('SELECT * FROM emails ORDER BY created_at DESC');
    return result.rows as unknown as EmailEntry[];
  }

  async deleteEmail(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: 'UPDATE emails SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      args: [id]
    });
    return result.rowsAffected > 0;
  }

  async restoreEmail(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: 'UPDATE emails SET deleted_at = NULL WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  }

  async getEmailById(id: number): Promise<EmailEntry | null> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: 'SELECT * FROM emails WHERE id = ?',
      args: [id]
    });
    return result.rows.length > 0 ? (result.rows[0] as unknown as EmailEntry) : null;
  }

  async getStats(): Promise<{ active: number; deleted: number; total: number }> {
    await this.ensureInitialized();
    const [activeResult, totalResult] = await Promise.all([
      turso.execute('SELECT COUNT(*) as count FROM emails WHERE deleted_at IS NULL'),
      turso.execute('SELECT COUNT(*) as count FROM emails')
    ]);

    const activeCount = (activeResult.rows[0] as unknown as { count: number }).count;
    const totalCount = (totalResult.rows[0] as unknown as { count: number }).count;

    return {
      active: activeCount,
      deleted: totalCount - activeCount,
      total: totalCount
    };
  }
}

export const emailDatabase = new EmailDatabase();
