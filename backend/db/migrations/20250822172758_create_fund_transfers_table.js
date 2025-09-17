// backend/db/migrations/YYYYMMDDHHMMSS_create_fund_transfers_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('fund_transfers', function(table) {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users');
    table.integer('recipient_id').unsigned().notNullable().references('id').inTable('users');
    table.decimal('amount', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('fund_transfers');
};