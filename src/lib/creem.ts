import { createCreem } from 'creem_io';

if (!process.env.CREEM_API_KEY) {
  throw new Error('CREEM_API_KEY environment variable is not set');
}

export const creem = createCreem({
  apiKey: process.env.CREEM_API_KEY,
  testMode: process.env.NODE_ENV !== 'production',
});

export const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID || '';
