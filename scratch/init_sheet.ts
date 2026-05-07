import { SheetsClient } from '../src/sheets/client.js';
import { logger } from '../src/logger/index.js';
import * as dotenv from 'dotenv';

dotenv.config();

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
    await SheetsClient.setHeaders(headers);
    console.log('Headers successfully set!');
  } catch (err) {
    console.error('Failed to set headers:', err);
  }
}

init();
