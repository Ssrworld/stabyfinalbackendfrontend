exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('impersonation_token').nullable();
    table.timestamp('impersonation_token_expires').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('impersonation_token');
    table.dropColumn('impersonation_token_expires');
  });
};