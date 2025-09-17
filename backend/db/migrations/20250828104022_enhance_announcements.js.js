/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('announcements', function(table) {
    // मौजूदा status कॉलम को बदलें ताकि 'ARCHIVED' भी शामिल हो सके
    table.dropColumn('status');
  }).then(() => {
    return knex.schema.alterTable('announcements', function(table) {
      table.enu('status', ['PUBLISHED', 'DRAFT', 'ARCHIVED']).notNullable().defaultTo('PUBLISHED').after('content');
      table.boolean('show_on_homepage').notNullable().defaultTo(false).after('status');
      table.string('image_url').nullable().after('show_on_homepage');
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('announcements', function(table) {
    table.dropColumn('show_on_homepage');
    table.dropColumn('image_url');
    table.dropColumn('status');
  }).then(() => {
    return knex.schema.alterTable('announcements', function(table) {
      table.enu('status', ['DRAFT', 'PUBLISHED']).notNullable().defaultTo('PUBLISHED');
    });
  });
};