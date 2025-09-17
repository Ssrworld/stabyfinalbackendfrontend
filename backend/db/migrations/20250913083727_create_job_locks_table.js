// backend/db/migrations/YYYYMMDDHHMMSS_create_job_locks_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_locks', function(table) {
    // job_name को primary key बनाएंगे ताकि यह हमेशा unique रहे।
    table.string('job_name', 100).primary();
    table.timestamp('locked_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_locks');
};