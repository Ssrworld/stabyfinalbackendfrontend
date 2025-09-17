/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('promoter_commissions', function(table) {
    table.increments('id').primary();
    
    // प्रमोटर जिसे कमीशन मिला
    table.integer('promoter_id').unsigned().notNullable().references('id').inTable('users');
    
    // वह नया उपयोगकर्ता जिसके एक्टिवेशन से कमीशन मिला
    table.integer('from_user_id').unsigned().notNullable().references('id').inTable('users');
    
    // USDT में मिला कमीशन
    table.decimal('commission_amount', 12, 2).notNullable().defaultTo(0);
    
    // STBL में मिला टोकन कमीशन
    table.decimal('token_commission_amount', 18, 4).notNullable().defaultTo(0);
    
    // कमीशन का प्रकार, जैसे 'DIRECT_REFERRAL_BONUS' या 'MILESTONE_25_REFERRALS'
    table.string('commission_type').notNullable();
    
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // प्रदर्शन के लिए इंडेक्स
    table.index('promoter_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('promoter_commissions');
};