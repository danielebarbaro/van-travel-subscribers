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

    const ensureColumn = async (name: string, ddl: string) => {
      const info = await turso.execute('PRAGMA table_info(emails)');
      const exists = info.rows.some((row) => (row as Record<string, unknown>).name === name);
      if (!exists) {
        await turso.execute(`ALTER TABLE emails ADD COLUMN ${ddl}`);
      }
    };

    await ensureColumn('sub_daily_trips', 'sub_daily_trips INTEGER NOT NULL DEFAULT 1');
    await ensureColumn('sub_daily_itineraries', 'sub_daily_itineraries INTEGER NOT NULL DEFAULT 1');
    await ensureColumn('sub_custom_trip', 'sub_custom_trip INTEGER NOT NULL DEFAULT 0');
    await ensureColumn('custom_country', 'custom_country TEXT');
    await ensureColumn('custom_direction', 'custom_direction TEXT');
    await ensureColumn('custom_max_km', 'custom_max_km INTEGER');
    await ensureColumn('custom_date_from', 'custom_date_from TEXT');
    await ensureColumn('custom_date_to', 'custom_date_to TEXT');
    await ensureColumn('unsubscribe_token', 'unsubscribe_token TEXT');

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

export interface SubscriberPreferences {
  sub_daily_trips: number;
  sub_daily_itineraries: number;
  sub_custom_trip: number;
  custom_country: string | null;
  custom_direction: string | null;
  custom_max_km: number | null;
  custom_date_from: string | null;
  custom_date_to: string | null;
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

  async getPreferences(email: string): Promise<SubscriberPreferences | null> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: `SELECT sub_daily_trips, sub_daily_itineraries, sub_custom_trip,
                   custom_country, custom_direction, custom_max_km,
                   custom_date_from, custom_date_to
            FROM emails WHERE email = ? AND deleted_at IS NULL`,
      args: [email],
    });
    return result.rows.length > 0
      ? (result.rows[0] as unknown as SubscriberPreferences)
      : null;
  }

  async updatePreferences(email: string, prefs: SubscriberPreferences): Promise<boolean> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: `UPDATE emails SET
              sub_daily_trips = ?, sub_daily_itineraries = ?, sub_custom_trip = ?,
              custom_country = ?, custom_direction = ?, custom_max_km = ?,
              custom_date_from = ?, custom_date_to = ?
            WHERE email = ? AND deleted_at IS NULL`,
      args: [
        prefs.sub_daily_trips,
        prefs.sub_daily_itineraries,
        prefs.sub_custom_trip,
        prefs.custom_country,
        prefs.custom_direction,
        prefs.custom_max_km,
        prefs.custom_date_from,
        prefs.custom_date_to,
        email,
      ],
    });
    return result.rowsAffected > 0;
  }

  async softDeleteByEmail(email: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: 'UPDATE emails SET deleted_at = CURRENT_TIMESTAMP WHERE email = ? AND deleted_at IS NULL',
      args: [email],
    });
    return result.rowsAffected > 0;
  }

  async isActiveSubscriber(email: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await turso.execute({
      sql: 'SELECT 1 FROM emails WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      args: [email],
    });
    return result.rows.length > 0;
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
