/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // 'main_balance' कॉलम के बाद STBL टोकन के लिए एक नया कॉलम जोड़ें
    table.decimal('stbl_token_balance', 18, 4).notNullable().defaultTo(0.0000).after('main_balance');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('stbl_token_balance');
  });
};