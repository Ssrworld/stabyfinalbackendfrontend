exports.up = function(knex) {
  return knex.schema
    // टेबल 1: सपोर्ट टिकट के लिए
    .createTable('support_tickets', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('subject').notNullable();
      table.text('message', 'longtext').notNullable();
      table.enu('status', ['OPEN', 'ANSWERED', 'CLOSED']).notNullable().defaultTo('OPEN');
      table.enu('priority', ['LOW', 'MEDIUM', 'HIGH']).notNullable().defaultTo('MEDIUM');
      table.timestamps(true, true);
    })
    // टेबल 2: टिकट पर जवाब और अटैचमेंट के लिए
    .createTable('ticket_replies', function(table) {
      table.increments('id').primary();
      table.integer('ticket_id').unsigned().notNullable().references('id').inTable('support_tickets').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users'); // जवाब देने वाले का ID
      table.text('message', 'longtext');
      table.json('attachment').nullable(); // इमेज/वीडियो का URL और प्रकार स्टोर करने के लिए
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ticket_replies').dropTableIfExists('support_tickets');
};