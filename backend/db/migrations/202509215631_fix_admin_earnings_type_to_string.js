// यह माइग्रेशन ENUM की समस्या को हमेशा के लिए ठीक कर देगा।

exports.up = async function(knex) {
  console.log("🚀 Starting the final fix for 'admin_earnings' table...");

  // चरण 1: यह जांच करेगा कि 'type' कॉलम पहले से मौजूद है या नहीं।
  const hasTypeColumn = await knex.schema.hasColumn('admin_earnings', 'type');

  if (hasTypeColumn) {
    await knex.schema.alterTable('admin_earnings', function(table) {
      table.dropColumn('type');
      console.log("✅ Step 1: Existing 'type' column dropped successfully.");
    });
  } else {
    console.log("ℹ️ Step 1: 'type' column not found, which is expected for a fresh DB. Skipping drop.");
  }
  
  // चरण 2: एक नया, साफ 'type' कॉलम जोड़ें जो एक स्ट्रिंग है।
  await knex.schema.alterTable('admin_earnings', function(table) {
    table.string('type', 50).notNullable().defaultTo('UNKNOWN');
    console.log("✅ Step 2: New 'type' column (as string) added successfully.");
  });
  
  // चरण 3: व्यावसायिक तर्क के आधार पर सभी रिकॉर्ड्स को सही प्रकार में पुनर्प्राप्त करें।
  console.log("⏳ Step 3: Recovering transaction types based on business logic...");

  // JOINING_FEE: amount > 0, pool_level = 0, and sponsor_id is NULL
  const joiningFees = await knex('admin_earnings')
    .where({ type: 'UNKNOWN', pool_level: 0 })
    .whereNull('sponsor_id')
    .andWhere('amount', '>', 0)
    .update({ type: 'JOINING_FEE' });
  if(joiningFees > 0) console.log(`- Recovered ${joiningFees} 'JOINING_FEE' records.`);

  // DIRECT_REFERRAL: has a sponsor_id, and pool_level is 0
  const referralFees = await knex('admin_earnings')
    .where({ type: 'UNKNOWN', pool_level: 0 })
    .whereNotNull('sponsor_id')
    .update({ type: 'DIRECT_REFERRAL' });
  if(referralFees > 0) console.log(`- Recovered ${referralFees} 'DIRECT_REFERRAL' records.`);

  // POOL_PAYOUT: amount < 0 and pool_level > 0
  const poolPayouts = await knex('admin_earnings')
    .where({ type: 'UNKNOWN' })
    .where('pool_level', '>', 0)
    .andWhere('amount', '<', 0)
    .update({ type: 'POOL_PAYOUT' });
  if(poolPayouts > 0) console.log(`- Recovered ${poolPayouts} 'POOL_PAYOUT' records.`);
    
  // WITHDRAWAL_FEE: based on notes, if available. यह अब सही से काम करेगा।
  const withdrawalFees = await knex('admin_earnings')
    .where({ type: 'UNKNOWN' })
    .andWhere('notes', 'like', '%Withdrawal Fee%')
    .update({ type: 'WITHDRAWAL_FEE' });
  if(withdrawalFees > 0) console.log(`- Recovered ${withdrawalFees} 'WITHDRAWAL_FEE' records.`);

  // P2P_FEE: based on notes, if available. यह भी अब सही से काम करेगा।
  const p2pFees = await knex('admin_earnings')
    .where({ type: 'UNKNOWN' })
    .andWhere('notes', 'like', '%P2P transfer%')
    .update({ type: 'P2P_FEE' });
  if(p2pFees > 0) console.log(`- Recovered ${p2pFees} 'P2P_FEE' records.`);

  const remainingUnknown = await knex('admin_earnings').where({ type: 'UNKNOWN' }).count('* as count').first();
  console.log(`- ⚠️  ${remainingUnknown.count} records remain 'UNKNOWN'. This should be 0 on a fresh DB.`);
  
  console.log("🎉 Final fix for 'admin_earnings' table completed.");
};

exports.down = function(knex) {
  return knex.schema.alterTable('admin_earnings', function(table) {
    table.dropColumn('type');
  });
};