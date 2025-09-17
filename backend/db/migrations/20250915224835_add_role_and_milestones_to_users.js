/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // 'email' कॉलम के बाद 'role' कॉलम जोड़ें
    // ADMIN की भूमिका केवल user ID 1 के लिए आरक्षित होगी, लेकिन इसे विकल्प के रूप में रखना अच्छा है।
    table.enu('role', ['USER', 'PROMOTER', 'ADMIN'])
         .notNullable()
         .defaultTo('USER')
         .after('email');
    
    // प्रमोटर द्वारा हासिल किए गए मील के पत्थर को स्टोर करने के लिए JSON कॉलम
    // यह ट्रैक करेगा कि कौन सा इनाम दिया जा चुका है।
    table.json('achieved_promoter_milestones').nullable().after('role');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('role');
    table.dropColumn('achieved_promoter_milestones');
  });
};