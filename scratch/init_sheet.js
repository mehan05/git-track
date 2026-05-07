import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function init() {
  const headers = [
    'Date',
    '09:00-10:00 AM',
    '10:00-11:00 AM',
    '11:00-12:00 PM',
    '12:00-01:00 PM',
    '01:00-02:00 PM',
    '02:00-03:00 PM',
    '03:00-04:00 PM',
    '04:00-05:00 PM',
    '05:00-06:00 PM',
    '06:00-07:00 PM'
  ];

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME}!A1:K1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });
    console.log('Headers successfully set!');

    // Get sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === process.env.GOOGLE_SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // Apply formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
    console.log('Formatting successfully applied (WRAP strategy)!');
  } catch (err) {
    console.error('Failed to initialize sheet:', err);
  }
}

init();
