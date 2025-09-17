/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // --- समाधान: यहाँ से debugger; लाइन हटा दी गई है ---
  return knex.schema.alterTable('admin_earnings', function(table) {
    // नया कॉलम: कमीशन प्राप्त करने वाले प्रायोजक के लिए
    table.integer('sponsor_id').unsigned().nullable().after('user_id');
    // विदेशी कुंजी (Foreign Key) इसे users टेबल से जोड़ती है
    table.foreign('sponsor_id').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('admin_earnings', function(table) {
    // विदेशी कुंजी को पहले हटाएं
    table.dropForeign('sponsor_id');
    // फिर कॉलम को हटाएं
    table.dropColumn('sponsor_id');
  });
};