/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // 'type' कॉलम को एक सामान्य स्ट्रिंग में बदलने से यह भविष्य के लिए अधिक लचीला हो जाएगा
  // और ENUM प्रकार की समस्याओं से बचाएगा।
  return knex.schema.alterTable('admin_earnings', function(table) {
    // .alter() का उपयोग मौजूदा कॉलम के प्रकार को बदलने के लिए किया जाता है।
    table.string('type', 50).notNullable().defaultTo('UNKNOWN').alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // डाउन माइग्रेशन में, हम इसे वापस ENUM में बदल सकते हैं,
  // हालाँकि इसे स्ट्रिंग के रूप में रखना बेहतर है।
  // अभी के लिए, हम इसे सरल रखते हैं।
  return knex.schema.alterTable('admin_earnings', function(table) {
     // यदि आवश्यक हो तो यहाँ डाउन लॉजिक जोड़ें
  });
};