// मौजूदा प्रकार
const oldTypes = ['JOINING_FEE', 'WITHDRAWAL_FEE', 'DIRECT_REFERRAL'];
// नए प्रकार (POOL_CONTRIBUTION को हटा दिया गया है क्योंकि यह उपयोग में नहीं है)
const newTypes = ['JOINING_FEE', 'WITHDRAWAL_FEE', 'DIRECT_REFERRAL', 'POOL_PAYOUT'];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // ENUM प्रकार को बदलने का सबसे सुरक्षित तरीका कॉलम को हटाकर नए मानों के साथ फिर से जोड़ना है।
  return knex.schema.alterTable('admin_earnings', function(table) {
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('admin_earnings', function(table) {
      table.enu('type', newTypes).notNullable().defaultTo('JOINING_FEE');
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // यह बदलाव को उल्टा कर देगा
  return knex.schema.alterTable('admin_earnings', function(table) {
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('admin_earnings', function(table) {
      table.enu('type', oldTypes).notNullable();
    });
  });
};