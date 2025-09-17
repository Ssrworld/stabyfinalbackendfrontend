// backend/src/scripts/bootstrap.js (SIMPLE VERSION)
const bcrypt = require('bcryptjs');
const { encrypt } = require('../services/crypto.service');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const db = require('../config/db.config');

const bootstrapDatabase = async () => {
  console.log('[Bootstrap] 🚀 Checking if initial users exist...');
  
  try {
    const adminUser = await db('users').where('id', 1).first();
    
    if (adminUser) {
      console.log('[Bootstrap] ✅ Admin user already exists. No action needed.');
      return;
    }

    console.log('[Bootstrap] ⏳ Initial users not found. Creating Admin (ID 1) and System (ID 2) users in PENDING state...');
    
    const { 
      ADMIN_EMAIL, ADMIN_PASSWORD, SYSTEM_USER_PASSWORD, 
      USER_WALLETS_MASTER_MNEMONIC, MASTER_WALLET_ADDRESS 
    } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SYSTEM_USER_PASSWORD || !USER_WALLETS_MASTER_MNEMONIC || !MASTER_WALLET_ADDRESS) {
      throw new Error('Bootstrap failed: Missing required environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, etc.).');
    }

    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const systemPasswordHash = await bcrypt.hash(SYSTEM_USER_PASSWORD, 10);

    const seed = await bip39.mnemonicToSeed(USER_WALLETS_MASTER_MNEMONIC);
    const masterNode = hdkey.fromMasterSeed(seed);

    // एडमिन वॉलेट (ID 1)
    const adminNode = masterNode.derivePath("m/44'/60'/0'/0/1");
    const adminWalletAddress = adminNode.getWallet().getAddressString();
    const encryptedAdminIndex = await encrypt('1');

    // सिस्टम रूट वॉलेट (ID 2)
    const systemNode = masterNode.derivePath("m/44'/60'/0'/0/2");
    const systemWalletAddress = systemNode.getWallet().getAddressString();
    const encryptedSystemIndex = await encrypt('2');
    
    if (adminWalletAddress.toLowerCase() === MASTER_WALLET_ADDRESS.toLowerCase() || systemWalletAddress.toLowerCase() === MASTER_WALLET_ADDRESS.toLowerCase()) {
        throw new Error("Critical security error: A generated system address matches the master wallet address.");
    }

    // डेटाबेस में केवल दो उपयोगकर्ताओं को डालें
    await db('users').insert([
      {
        id: 1,
        email: ADMIN_EMAIL,
        password_hash: adminPasswordHash,
        status: 'PENDING',
        wallet_address: adminWalletAddress,
        encrypted_mnemonic: encryptedAdminIndex,
        referral_code: 'ADMIN',
        referred_by: null,
        current_pool: 0,
        activation_timestamp: null,
        global_placement_id: null
      },
      {
        id: 2,
        email: 'system@stabylink.com',
        password_hash: systemPasswordHash,
        status: 'PENDING',
        wallet_address: systemWalletAddress,
        encrypted_mnemonic: encryptedSystemIndex,
        referral_code: 'SYSTEM',
        referred_by: 1,
        original_sponsor_id: 1,
        current_pool: 0,
        activation_timestamp: null,
        global_placement_id: null
      }
    ]);
    
    try {
        await db.raw(`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));`);
        console.log('[Bootstrap] Successfully updated PostgreSQL sequence for users table.');
    } catch(e) {
        console.log('[Bootstrap] Not a PostgreSQL DB or sequence update not needed.');
    }

    console.log('[Bootstrap] ✅ Successfully created Admin and System users in PENDING state.');

  } catch (error) {
    console.error('[Bootstrap] ❌ CRITICAL ERROR during database bootstrap:', error);
    process.exit(1);
  }
};

module.exports = { bootstrapDatabase };