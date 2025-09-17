// backend/db/migrations/YYYYMMDDHHMMSS_alter_tickets_message_nullable.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // 'support_tickets' टेबल के 'message' कॉलम को NULL होने की इजाज़त दें।
  return knex.schema.alterTable('support_tickets', function(table) {
    // .alter() का मतलब है कि हम मौजूदा कॉलम को बदल रहे हैं।
    table.text('message', 'longtext').nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // अगर कभी इस बदलाव को वापस लेना हो, तो कॉलम को फिर से 'notNullable' बना दें।
  return knex.schema.alterTable('support_tickets', function(table) {
    table.text('message', 'longtext').notNullable().alter();
  });
};