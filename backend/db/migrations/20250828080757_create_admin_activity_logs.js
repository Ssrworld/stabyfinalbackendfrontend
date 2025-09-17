/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('admin_activity_logs', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable().references('id').inTable('users');
    table.string('action_type', 50).notNullable(); // e.g., 'USER_UPDATE', 'FUNDS_CREDIT'
    table.integer('target_user_id').unsigned().nullable().references('id').inTable('users');
    table.json('details').nullable(); // Details of what was changed
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('admin_activity_logs');
};