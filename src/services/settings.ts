import { db } from '../database/db.js';

export interface ManagerSettings {
  cron_time: string;
  disabled_days: string[]; // Array of strings like ["Saturday", "Sunday"]
  last_report_at: string | null;
}

export class SettingsService {
  public static getSettings(): ManagerSettings {
    const row = db.prepare('SELECT cron_time, disabled_days, last_report_at FROM manager_settings WHERE id = 1').get() as any;
    return {
      cron_time: row.cron_time,
      disabled_days: JSON.parse(row.disabled_days),
      last_report_at: row.last_report_at,
    };
  }

  public static updateSettings(cronTime?: string, disabledDays?: string[], lastReportAt?: string): void {
    if (cronTime) {
      db.prepare('UPDATE manager_settings SET cron_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(cronTime);
    }
    if (disabledDays) {
      db.prepare('UPDATE manager_settings SET disabled_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(JSON.stringify(disabledDays));
    }
    if (lastReportAt) {
      db.prepare('UPDATE manager_settings SET last_report_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(lastReportAt);
    }
  }
}
