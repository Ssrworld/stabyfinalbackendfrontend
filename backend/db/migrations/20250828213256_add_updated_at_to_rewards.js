/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // stbl_token_rewards टेबल में बदलाव करें
  return knex.schema.alterTable('stbl_token_rewards', function(table) {
    // 'created_at' कॉलम के बाद एक नया 'updated_at' कॉलम जोड़ें
    // यह कॉलम तब अपडेट होगा जब एडमिन रिवॉर्ड का स्टेटस बदलेगा
    table.timestamp('updated_at').defaultTo(knex.fn.now()).after('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // अगर माइग्रेशन को रोलबैक करना हो तो इस कॉलम को हटा दें
  return knex.schema.alterTable('stbl_token_rewards', function(table) {
    table.dropColumn('updated_at');
  });
};