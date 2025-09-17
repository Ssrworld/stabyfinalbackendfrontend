/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('announcements', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable().references('id').inTable('users');
    table.string('subject', 255).notNullable();
    table.text('content', 'longtext').notNullable();
    table.enu('status', ['DRAFT', 'PUBLISHED']).notNullable().defaultTo('PUBLISHED');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('announcements');
};