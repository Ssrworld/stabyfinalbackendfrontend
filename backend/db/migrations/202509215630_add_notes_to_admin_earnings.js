// backend/db/migrations/YYYYMMDDHHMMSS_add_notes_to_admin_earnings.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('admin_earnings', function(table) {
    // 'pool_level' कॉलम के बाद एक नया 'notes' कॉलम जोड़ें
    table.string('notes', 255).nullable().after('pool_level');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('admin_earnings', function(table) {
    // अगर माइग्रेशन को रोलबैक करना हो तो इस कॉलम को हटा दें
    table.dropColumn('notes');
  });
};