/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stbl_token_rewards', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    table.decimal('amount', 18, 4).notNullable();
    table.string('reason', 255).notNullable();
    table.enu('status', ['PAID', 'PENDING', 'FAILED']).notNullable().defaultTo('PAID'); // Phase 1 में सब 'PAID' रहेगा
    table.string('transaction_hash', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stbl_token_rewards');
};