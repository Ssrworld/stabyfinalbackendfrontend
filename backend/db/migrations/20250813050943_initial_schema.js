/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Table: users
    .createTable('users', function (table) {
      table.increments('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      // MODIFIED: Added 'INSUFFICIENT_DEPOSIT' to the status ENUM
      table.enu('status', ['PENDING', 'ACTIVE', 'INSUFFICIENT_DEPOSIT']).notNullable().defaultTo('PENDING');
      table.string('wallet_address', 255).nullable().unique();
      table.text('encrypted_mnemonic').notNullable();
      table.string('payout_wallet', 255).nullable();
      table.integer('current_pool').notNullable().defaultTo(0);
      table.decimal('total_earnings', 12, 2).notNullable().defaultTo(0.00);
      table.decimal('withdrawable_balance', 12, 2).notNullable().defaultTo(0.00);
      table.integer('sponsor_id').unsigned().nullable();
      table.foreign('sponsor_id').references('id').inTable('users');
      table.integer('original_sponsor_id').unsigned().nullable();
      table.foreign('original_sponsor_id').references('id').inTable('users');
      table.string('referral_code', 20).notNullable().unique();
      table.integer('referred_by').unsigned().nullable();
      table.foreign('referred_by').references('id').inTable('users');
      table.boolean('funds_swept').notNullable().defaultTo(false);
      table.string('otp', 10).nullable();
      table.datetime('otp_expires').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Table: transactions
    .createTable('transactions', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('tx_hash', 255).notNullable();
      table.decimal('amount', 12, 2).notNullable();
      table.enu('status', ['VERIFIED', 'FAILED']).notNullable().defaultTo('VERIFIED');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Table: withdrawals
    .createTable('withdrawals', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.decimal('amount', 12, 2).notNullable();
      table.decimal('admin_fee', 12, 2).defaultTo(0.00);
      table.decimal('final_amount', 12, 2).notNullable();
      table.enu('status', ['PENDING', 'COMPLETED', 'FAILED']).notNullable().defaultTo('PENDING');
      table.string('tx_hash', 255).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at').nullable();
    })
    // Table: admin_earnings
    .createTable('admin_earnings', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users');
      table.enu('type', ['JOINING_FEE', 'WITHDRAWAL_FEE']).notNullable();
      table.integer('pool_level').nullable();
      table.decimal('amount', 12, 2).notNullable();
      table.decimal('turnover', 12, 2).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // NEW TABLE: partial_deposits
    .createTable('partial_deposits', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.decimal('amount', 14, 6).notNullable(); // Increased precision for crypto
        table.string('tx_hash', 255).notNullable().unique();
        table.boolean('is_processed').notNullable().defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // To reverse, we drop tables in the reverse order of creation
  return knex.schema
    .dropTableIfExists('partial_deposits') // Drop the new table first
    .dropTableIfExists('admin_earnings')
    .dropTableIfExists('withdrawals')
    .dropTableIfExists('transactions')
    .dropTableIfExists('users');
};