const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { ethers, JsonRpcProvider } = require('ethers');
const db = require('../config/db.config');
const { decrypt } = require('../services/crypto.service');
const readline = require('readline');

// --- Master Mnemonic Setup ---
const MASTER_MNEMONIC = process.env.USER_WALLETS_MASTER_MNEMONIC;
if (!MASTER_MNEMONIC) {
    throw new Error("FATAL: USER_WALLETS_MASTER_MNEMONIC is not set in .env file. Cannot recover user wallets.");
}
const masterNode = ethers.HDNodeWallet.fromPhrase(MASTER_MNEMONIC);

// --- Blockchain Configuration ---
const HTTP_RPC_URL = process.env.BSC_MAINNET_RPC_URL;
if (!HTTP_RPC_URL) {
    console.error("🔴 FATAL: BSC_MAINNET_RPC_URL is not set in the .env file.");
    process.exit(1);
}
const provider = new JsonRpcProvider(HTTP_RPC_URL);
const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const USDT_DECIMALS = 18;
const USDT_ABI = ["function balanceOf(address) view returns (uint256)"];
const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function showBalances(address) {
    try {
        console.log(`\n💰 Fetching live balances for ${address}...`);
        const bnbBalanceWei = await provider.getBalance(address);
        const bnbBalance = ethers.formatEther(bnbBalanceWei);
        const usdtBalanceWei = await usdtContract.balanceOf(address);
        const usdtBalance = ethers.formatUnits(usdtBalanceWei, USDT_DECIMALS);
        console.log('--- Live Balances ---');
        console.log(`BNB:  ${parseFloat(bnbBalance).toFixed(6)}`);
        console.log(`USDT: ${parseFloat(usdtBalance).toFixed(4)}`);
        console.log('---------------------');
    } catch (error) {
        console.error(`\n❌ Could not fetch balances: ${error.message}`);
    }
}

async function findWalletDetails() {
  console.log('--- HD Wallet Details & Recovery Tool ---');
  console.log('WARNING: This tool exposes sensitive information. Use with extreme caution.');
  
  rl.question('\nEnter the user\'s wallet address: ', async (address) => {
    if (!ethers.isAddress(address)) {
      console.error('\n❌ Invalid Ethereum address format. Please try again.');
      rl.close();
      await db.destroy();
      return;
    }

    try {
      console.log(`\n🔍 Searching for address: ${address} in the database...`);
      
      const user = await db('users').where('wallet_address', address).first('id', 'email', 'encrypted_mnemonic');

      if (!user) {
        console.error(`\n❌ Address not found in the database.`);
        await showBalances(address); 
        rl.close();
        await db.destroy();
        return;
      }
      
      console.log(`✅ User found: ${user.email} (ID: ${user.id})`);

      console.log('🔑 Decrypting derivation index...');
      const derivationIndex = await decrypt(user.encrypted_mnemonic);

      if (derivationIndex === null || isNaN(parseInt(derivationIndex))) {
        console.error('\n❌ Decryption failed or index is not a number! Check ENCRYPTION_PASSWORD or data integrity.');
        rl.close();
        await db.destroy();
        return;
      }
      
      console.log(`Derivation index found: ${derivationIndex}`);

      const derivationPath = `m/44'/60'/0'/0/${derivationIndex}`;
      const wallet = masterNode.derivePath(derivationPath);

      if (wallet.address.toLowerCase() !== address.toLowerCase()) {
        console.error('\n❌ CRITICAL ERROR: Mismatch between provided address and address generated from index.');
        console.error(`   DB Address: ${address}`);
        console.error(`   Generated:  ${wallet.address}`);
        rl.close();
        await db.destroy();
        return;
      }
      
      await showBalances(wallet.address);

      console.log('\n--- ⚠️ SENSITIVE INFORMATION ---');
      console.log(`Derivation Path: ${derivationPath}`);
      console.log(`Address:         ${wallet.address}`);
      console.log(`Private Key:     ${wallet.privateKey}`);
      console.log('---------------------------------');
      console.log('This wallet was derived from the master mnemonic. The mnemonic itself is not shown here.');

    } catch (error) {
      console.error('\n❌ An error occurred:', error.message);
    } finally {
      rl.close();
      setTimeout(() => {
        db.destroy();
        console.log('\nTool finished. Connection closed.');
      }, 500);
    }
  });
}

findWalletDetails();