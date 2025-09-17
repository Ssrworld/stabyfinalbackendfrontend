const oldStatus = ['PAID', 'PENDING', 'FAILED'];
const newStatus = ['UNCLAIMED', 'CLAIMED', 'PENDING_TRANSFER', 'TRANSFERRED', 'FAILED'];

exports.up = function(knex) {
  return knex.schema.alterTable('stbl_token_rewards', function(table) {
    table.string('payout_wallet_address').nullable().after('reason');
    table.dropColumn('status');
  }).then(() => {
    return knex.schema.alterTable('stbl_token_rewards', function(table) {
      table.enu('status', newStatus).notNullable().defaultTo('UNCLAIMED');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('stbl_token_rewards', async function(table) {
    // पहले जांचें कि कॉलम मौजूद है या नहीं
    const hasPayoutColumn = await knex.schema.hasColumn('stbl_token_rewards', 'payout_wallet_address');
    if (hasPayoutColumn) {
      table.dropColumn('payout_wallet_address');
    }
    
    const hasStatusColumn = await knex.schema.hasColumn('stbl_token_rewards', 'status');
    if (hasStatusColumn) {
        table.dropColumn('status');
    }
  }).then(() => {
    return knex.schema.alterTable('stbl_token_rewards', function(table) {
      table.enu('status', oldStatus).notNullable().defaultTo('PAID');
    });
  });
};