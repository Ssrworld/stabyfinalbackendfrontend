require('dotenv').config({ path: '../../.env' });
const { processQueue } = require('../services/poolEngine.service');
const db = require('../config/db.config');

async function main() {
  console.log('--- Starting Pool Engine Cycle ---');
  try {
    const result = await processQueue();
    console.log('--- Cycle Finished ---', result);
  } catch (error) {
    console.error('--- Cycle Failed with an error ---');
  } finally {
    // MySQL पूल को बंद करें ताकि स्क्रिप्ट ठीक से बाहर निकल सके
    db.end();
  }
}

main();