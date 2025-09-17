// backend/db/migrations/TIMESTAMP_add_activation_details_to_users.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.timestamp('activation_timestamp').nullable();
    
    // --- समाधान: इसे एक सामान्य integer कॉलम बनाएं, जो unique हो सकता है ---
    table.integer('global_placement_id').unsigned().nullable().unique();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('activation_timestamp');
    table.dropColumn('global_placement_id');
  });
};