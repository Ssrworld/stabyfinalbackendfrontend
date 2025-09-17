// backend/db/migrations/YYYYMMDDHHMMSS_create_system_settings_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    // 'key' को प्राइमरी की बनाएंगे ताकि यह हमेशा यूनिक रहे।
    table.string('setting_key', 50).primary();
    table.string('setting_value', 255).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('system_settings');
};