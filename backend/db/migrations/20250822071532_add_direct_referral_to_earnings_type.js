// backend/db/migrations/YYYYMMDDHHMMSS_add_direct_referral_to_earnings_type.js

const oldTypes = ['JOINING_FEE', 'WITHDRAWAL_FEE'];
const newTypes = ['JOINING_FEE', 'WITHDRAWAL_FEE', 'DIRECT_REFERRAL'];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('admin_earnings', function(table) {
    // Drop the type column and re-add it with the new ENUM values.
    // This is a safe way to handle ENUM changes across different SQL databases.
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('admin_earnings', function(table) {
      table.enu('type', newTypes).notNullable().defaultTo('JOINING_FEE');
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // This reverses the change, reverting back to the old ENUM values.
  return knex.schema.alterTable('admin_earnings', function(table) {
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('admin_earnings', function(table) {
      table.enu('type', oldTypes).notNullable();
    });
  });
};