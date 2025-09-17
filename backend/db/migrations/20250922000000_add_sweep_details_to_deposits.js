// backend/db/migrations/20250922000000_add_sweep_details_to_deposits.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('partial_deposits', function(table) {
    // स्वीप की स्थिति को ट्रैक करने के लिए ENUM कॉलम
    table.enu('sweep_status', ['PENDING', 'SWEPT', 'FAILED', 'NOT_REQUIRED'])
         .notNullable()
         .defaultTo('PENDING')
         .after('is_processed');
    // स्वीप ट्रांजैक्शन के हैश को स्टोर करने के लिए कॉलम
    table.string('sweep_tx_hash', 255).nullable().after('sweep_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('partial_deposits', function(table) {
    table.dropColumn('sweep_status');
    table.dropColumn('sweep_tx_hash');
  });
};