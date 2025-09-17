// backend/db/migrations/20250922000001_add_indexes_for_performance.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 'users' टेबल पर इंडेक्स
    .alterTable('users', function(table) {
      table.index('status');
      table.index('referred_by');
      table.index('original_sponsor_id');
      table.index('current_pool');
    })
    // 'withdrawals' टेबल पर इंडेक्स
    .alterTable('withdrawals', function(table) {
      table.index('user_id');
      table.index('status');
    })
    // 'partial_deposits' टेबल पर इंडेक्स
    .alterTable('partial_deposits', function(table) {
      table.index('user_id');
      // यह लाइन अब सही तरीके से काम करेगी
      table.index('sweep_status'); 
    })
    // 'admin_earnings' टेबल पर इंडेक्स
    .alterTable('admin_earnings', function(table) {
      table.index('user_id');
      table.index('sponsor_id');
      table.index('type');
    })
    // 'email_queue' टेबल पर इंडेक्स
    .alterTable('email_queue', function(table) {
      table.index('status');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // यह 'up' फंक्शन में किए गए सभी बदलावों को उल्टा कर देगा।
  return knex.schema
    .alterTable('users', function(table) {
      table.dropIndex('status');
      table.dropIndex('referred_by');
      table.dropIndex('original_sponsor_id');
      table.dropIndex('current_pool');
    })
    .alterTable('withdrawals', function(table) {
      table.dropIndex('user_id');
      table.dropIndex('status');
    })
    .alterTable('partial_deposits', function(table) {
      table.dropIndex('user_id');
      table.dropIndex('sweep_status');
    })
    .alterTable('admin_earnings', function(table) {
      table.dropIndex('user_id');
      table.dropIndex('sponsor_id');
      table.dropIndex('type');
    })
    .alterTable('email_queue', function(table) {
        table.dropIndex('status');
    });
};