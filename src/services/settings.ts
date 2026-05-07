import { db } from '../database/db.js';

export interface ManagerSettings {
  cron_time: string;
  disabled_days: string[]; // Array of strings like ["Saturday", "Sunday"]
}

export class SettingsService {
  public static getSettings(): ManagerSettings {
    const row = db.prepare('SELECT cron_time, disabled_days FROM manager_settings WHERE id = 1').get() as any;
    return {
      cron_time: row.cron_time,
      disabled_days: JSON.parse(row.disabled_days),
    };
  }

  public static updateSettings(cronTime?: string, disabledDays?: string[]): void {
    if (cronTime) {
      db.prepare('UPDATE manager_settings SET cron_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(cronTime);
    }
    if (disabledDays) {
      db.prepare('UPDATE manager_settings SET disabled_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(JSON.stringify(disabledDays));
    }
  }
}
