/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('system_health_checks', function(table) {
    table.increments('id').primary();
    table.string('service_name', 50).notNullable().unique();
    table.timestamp('last_run_timestamp').defaultTo(knex.fn.now());
    table.enu('status', ['OK', 'ERROR']).notNullable().defaultTo('OK');
    table.text('details').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('system_health_checks');
};