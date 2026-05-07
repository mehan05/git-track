import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';
import { MatrixRow } from '../types/index.js';

export class SheetsClient {
  private static auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_CLIENT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  private static sheets = google.sheets({ version: 'v4', auth: this.auth });

  public static async getLastRow(): Promise<string[] | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `${env.GOOGLE_SHEET_NAME}!A:K`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return null;

      // Filter out header row if it contains "10-11am" or similar
      const lastRow = rows[rows.length - 1];
      // Check if it's a header (contains "09:00" or similar)
      if (lastRow[1] && lastRow[1].includes('-')) return null; 

      return lastRow;
    } catch (err) {
      logger.error(`Error fetching last row: ${(err as Error).message}`);
      return null;
    }
  }

  public static async appendRow(row: string[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `${env.GOOGLE_SHEET_NAME}!A:K`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      logger.info(`Successfully synced commit to Google Sheets matrix`);
    } catch (err) {
      logger.error(`Error appending row to Google Sheets: ${(err as Error).message}`);
      throw err;
    }
  }

  public static async getAllRows(): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `${env.GOOGLE_SHEET_NAME}!A:K`,
      });
      return response.data.values || [];
    } catch (err) {
      logger.error(`Error fetching all rows: ${(err as Error).message}`);
      return [];
    }
  }

  public static async updateCell(rowNumber: number, colIndex: number, value: string): Promise<void> {
    const colLetter = String.fromCharCode(65 + colIndex); // 0=A, 1=B...
    const range = `${env.GOOGLE_SHEET_NAME}!${colLetter}${rowNumber}`;

    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });
      logger.info(`Successfully updated cell ${range}`);
    } catch (err) {
      logger.error(`Error updating cell ${range}: ${(err as Error).message}`);
      throw err;
    }
  }

  public static async setHeaders(headers: string[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `${env.GOOGLE_SHEET_NAME}!A1:K1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      logger.info(`Successfully updated Google Sheets headers`);
    } catch (err) {
      logger.error(`Error updating headers: ${(err as Error).message}`);
      throw err;
    }
  }

  public static async applyFormatting(): Promise<void> {
    try {
      const sheetId = await this.getSheetId();
      
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startColumnIndex: 1, // B
                  endColumnIndex: 11, // K
                },
                cell: {
                  userEnteredFormat: {
                    wrapStrategy: 'WRAP',
                    verticalAlignment: 'TOP',
                  },
                },
                fields: 'userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment',
              },
            },
          ],
        },
      });
      logger.info(`Successfully applied WRAP formatting to commit columns`);
    } catch (err) {
      logger.error(`Error applying formatting: ${(err as Error).message}`);
      throw err;
    }
  }

  private static async getSheetId(): Promise<number> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === env.GOOGLE_SHEET_NAME
    );

    if (!sheet || sheet.properties?.sheetId == null) {
      throw new Error(`Sheet "${env.GOOGLE_SHEET_NAME}" not found`);
    }

    return sheet.properties.sheetId;
  }
}
