// backend/db/migrations/YYYYMMDDHHMMSS_add_mobile_to_users.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // 'email' कॉलम के बाद एक नया 'mobile_number' कॉलम जोड़ें
    table.string('mobile_number', 32).nullable().unique().after('email');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // अगर माइग्रेशन को रोलबैक करना हो तो इस कॉलम को हटा दें
    table.dropColumn('mobile_number');
  });
};