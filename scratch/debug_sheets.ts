import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function debug() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
  
  // Get sheet properties to find total rows
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
  const rowCount = sheet?.properties?.gridProperties?.rowCount || 1000;
  
  console.log(`Sheet has ${rowCount} rows`);
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A140:H180`,
  });
  console.log('Rows 140-180:', data.data.values);
}

debug().catch(console.error);
