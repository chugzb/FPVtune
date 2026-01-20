import { createCreem } from 'creem_io';

if (!process.env.CREEM_API_KEY) {
  throw new Error('CREEM_API_KEY environment variable is not set');
}

const apiKey = process.env.CREEM_API_KEY;
const isTestKey = apiKey.startsWith('creem_test_');

export const creem = createCreem({
  apiKey,
  testMode: isTestKey,
});

export const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID || '';
