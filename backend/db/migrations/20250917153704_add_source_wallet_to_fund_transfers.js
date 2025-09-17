// backend/db/migrations/YYYYMMDDHHMMSS_add_source_wallet_to_fund_transfers.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('fund_transfers', function(table) {
    // 'amount' कॉलम के बाद एक नया कॉलम जोड़ें ताकि पता चल सके कि पैसा कहाँ से आया
    table.enu('source_wallet', ['main', 'withdrawable'])
         .notNullable()
         .defaultTo('main') // पुराने रिकॉर्ड्स को सुरक्षित रूप से 'main' मानें
         .after('amount');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('fund_transfers', function(table) {
    // यदि माइग्रेशन को रोलबैक करना हो तो कॉलम को हटा दें
    table.dropColumn('source_wallet');
  });
};