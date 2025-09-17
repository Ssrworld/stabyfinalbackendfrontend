/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // stbl_token_rewards टेबल में बदलाव करें
  return knex.schema.alterTable('stbl_token_rewards', function(table) {
    // 'status' कॉलम के बाद एक नया 'tx_hash' कॉलम जोड़ें
    // यह ट्रांजैक्शन हैश को स्टोर करेगा जब रिवॉर्ड भेजा जाएगा
    table.string('tx_hash', 255).nullable().after('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // अगर माइग्रेशन को रोलबैक करना हो तो इस कॉलम को हटा दें
  return knex.schema.alterTable('stbl_token_rewards', function(table) {
    table.dropColumn('tx_hash');
  });
};