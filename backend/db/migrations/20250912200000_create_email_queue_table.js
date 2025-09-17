// backend/db/migrations/20250912200000_create_email_queue_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('email_queue', function(table) {
    table.increments('id').primary();
    table.string('recipient_email').notNullable();
    table.string('subject').notNullable();
    table.text('content_html', 'longtext').notNullable();
    table.enu('status', ['PENDING', 'SENT', 'FAILED']).notNullable().defaultTo('PENDING');
    table.integer('attempts').notNullable().defaultTo(0);
    table.text('last_error').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('email_queue');
};
