/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // नया कॉलम: मुख्य वॉलेट बैलेंस के लिए
    table.decimal('main_balance', 12, 2).notNullable().defaultTo(0.00).after('withdrawable_balance');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('main_balance');
  });
};