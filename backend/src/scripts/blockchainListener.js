// backend/src/scripts/blockchainListener.js (FINAL A-to-Z CODE with 450 Block Range)

const path = require('path');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
}

const { ethers, JsonRpcProvider } = require('ethers');
const db = require('../config/db.config');
const { decrypt } = require('../services/crypto.service');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');

// --- PROVIDER & HOT WALLET SETUP ---
const HTTP_RPC_URL = process.env.BSC_MAINNET_RPC_URL;
const PAYOUT_MNEMONIC = process.env.PAYOUT_HOT_WALLET_MNEMONIC;
if (!HTTP_RPC_URL || !PAYOUT_MNEMONIC) {
    throw new Error("FATAL: BSC_MAINNET_RPC_URL or PAYOUT_MNEMONIC is not set.");
}
const provider = new JsonRpcProvider(HTTP_RPC_URL);
const hotWallet = ethers.Wallet.fromPhrase(PAYOUT_MNEMONIC).connect(provider);

// --- CONSTANTS ---
const MASTER_MNEMONIC = process.env.USER_WALLETS_MASTER_MNEMONIC;
const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS;
const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const USDT_DECIMALS = 18;
const GAS_TO_SEND_FOR_USDT_SWEEP = '0.0005';
const MIN_SWEEP_AMOUNT_BNB = 0.0006;
const MIN_SWEEP_AMOUNT_USDT = 0.01;
const BLOCKS_TO_RECHECK = 10;
// ✅✅✅ यहीं पर बदलाव किया गया है ✅✅✅
const MAX_BLOCK_RANGE = 450; // एक बार में स्कैन करने के लिए एक बहुत ही सुरक्षित ब्लॉक रेंज
const ADDRESS_BATCH_SIZE = 200;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getLastProcessedBlock() {
    const setting = await db('system_settings').where('setting_key', 'last_processed_block').first();
    if (!setting) {
        const latestBlock = await provider.getBlockNumber();
        return latestBlock - MAX_BLOCK_RANGE;
    }
    return parseInt(setting.setting_value, 10);
}

async function setLastProcessedBlock(blockNumber) {
    await db('system_settings')
        .insert({ setting_key: 'last_processed_block', setting_value: blockNumber.toString() })
        .onConflict('setting_key')
        .merge();
}

async function checkAndSweepDeposits() {
    console.log(`[Deposit&Sweep] Starting scalable check cycle...`);
    
    // =================================================================
    // PART A: DEPOSIT LOGGER
    // =================================================================
    const recentlyDepositedUserIds = new Set();
    try {
        const allUserWallets = await db('users').whereNotIn('id', [1]).select('id', 'wallet_address');
        
        if (allUserWallets.length === 0) {
            console.log('[DepositLogger] No users to check.');
            return;
        }

        const addressToUserIdMap = new Map(allUserWallets.map(u => [u.wallet_address.toLowerCase(), u.id]));
        const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ["event Transfer(address indexed from, address indexed to, uint256 value)"], provider);

        const latestBlock = await provider.getBlockNumber();
        let fromBlock = (await getLastProcessedBlock()) - BLOCKS_TO_RECHECK;
        
        console.log(`[DepositLogger] Scanning blocks from ${fromBlock} to ${latestBlock} for ${allUserWallets.length} users.`);

        for (let i = 0; i < allUserWallets.length; i += ADDRESS_BATCH_SIZE) {
            const batch = allUserWallets.slice(i, i + ADDRESS_BATCH_SIZE);
            const addressBatch = batch.map(u => u.wallet_address);
            
            console.log(`[DepositLogger] Processing address batch ${Math.floor(i / ADDRESS_BATCH_SIZE) + 1} of ${Math.ceil(allUserWallets.length / ADDRESS_BATCH_SIZE)}...`);

            const filter = usdtContract.filters.Transfer(null, addressBatch);

            for (let currentBlock = fromBlock; currentBlock <= latestBlock; currentBlock += MAX_BLOCK_RANGE) {
                const toBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, latestBlock);
                
                try {
                    const events = await usdtContract.queryFilter(filter, currentBlock, toBlock);

                    if (events.length > 0) {
                        console.log(`[DepositLogger] Found ${events.length} potential deposits in chunk ${currentBlock}-${toBlock} for this address batch.`);
                        for (const event of events) {
                            const txHash = event.transactionHash;
                            const recipientAddress = event.args.to.toLowerCase();
                            const userId = addressToUserIdMap.get(recipientAddress);

                            if (!userId) continue;

                            const existingTx = await db('partial_deposits').where('tx_hash', txHash).first();
                            if (!existingTx) {
                                const amount = parseFloat(ethers.formatUnits(event.args.value, USDT_DECIMALS));
                                await db('partial_deposits').insert({ user_id: userId, amount, tx_hash: txHash });
                                console.log(`[DepositLogger] ✅ Logged new deposit of ${amount.toFixed(4)} USDT for User ID ${userId}.`);
                                recentlyDepositedUserIds.add(userId);
                            }
                        }
                    }
                } catch (chunkError) {
                    console.error(`[DepositLogger] ⚠️ Error scanning chunk ${currentBlock}-${toBlock}. It might be skipped. Error: ${chunkError.message}`);
                }
            }
            await delay(500);
        }
        
        await setLastProcessedBlock(latestBlock);

    } catch (error) {
        console.error(`[DepositLogger] ❌ CRITICAL ERROR during deposit logging:`, error.message);
    }

    // =================================================================
    // PART B: FUND SWEEPER - (यह हिस्सा अपरिवर्तित है)
    // =================================================================
    try {
        const usersToSweepQuery = db('users as u')
            .whereIn('u.id', function() {
                this.from('partial_deposits').whereIn('sweep_status', ['PENDING', 'FAILED']).distinct('user_id');
            });
        
        if (recentlyDepositedUserIds.size > 0) {
            usersToSweepQuery.orWhereIn('u.id', Array.from(recentlyDepositedUserIds));
        }
        
        const usersToSweep = await usersToSweepQuery.select('u.*');
        
        if (usersToSweep.length === 0) return;

        console.log(`[Sweeper] Found ${usersToSweep.length} users with funds to potentially sweep.`);

        const seed = await bip39.mnemonicToSeed(MASTER_MNEMONIC);
        const masterNode = hdkey.fromMasterSeed(seed);
        const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ["function balanceOf(address) view returns (uint256)", "function transfer(address to, uint256 amount) returns (bool)"], provider);

        for (const user of usersToSweep) {
            try {
                const derivationIndex = await decrypt(user.encrypted_mnemonic);
                if (derivationIndex === null) { console.warn(`[Sweeper] Could not decrypt mnemonic for User ID ${user.id}. Skipping.`); continue; }
                const derivationPath = `m/44'/60'/0'/0/${derivationIndex}`;
                const childNode = masterNode.derivePath(derivationPath);
                const userEthWallet = childNode.getWallet();
                const privateKeyHex = '0x' + userEthWallet.getPrivateKey().toString('hex');
                const userWallet = new ethers.Wallet(privateKeyHex, provider);
                const usdtBalanceWei = await usdtContract.balanceOf(user.wallet_address);
                const usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceWei, USDT_DECIMALS));
                if (usdtBalance >= MIN_SWEEP_AMOUNT_USDT) {
                    const bnbBalanceWei = await provider.getBalance(user.wallet_address);
                    const feeData = await provider.getFeeData();
                    const estimatedGasForUsdt = await usdtContract.connect(userWallet).transfer.estimateGas(MASTER_WALLET_ADDRESS, usdtBalanceWei).catch(() => 100000n);
                    const requiredGasForUsdtWei = estimatedGasForUsdt * (feeData.gasPrice || ethers.parseUnits('3', 'gwei'));
                    if (bnbBalanceWei < requiredGasForUsdtWei) {
                        console.log(`[Sweeper] ⛽ User ID ${user.id} has USDT but insufficient gas. Sending gas...`);
                        const gasToSendWei = ethers.parseEther(GAS_TO_SEND_FOR_USDT_SWEEP);
                        const tx = await hotWallet.sendTransaction({ to: user.wallet_address, value: gasToSendWei });
                        await tx.wait();
                        console.log(`[Sweeper] ✅ Gas sent to User ID ${user.id}. Will be swept next cycle.`);
                    } else {
                        console.log(`[Sweeper] 🧹 Sweeping ${usdtBalance.toFixed(4)} USDT from User ID ${user.id}...`);
                        const sweepTx = await usdtContract.connect(userWallet).transfer(MASTER_WALLET_ADDRESS, usdtBalanceWei, { gasPrice: feeData.gasPrice });
                        await sweepTx.wait();
                        console.log(`[Sweeper] ✅ SUCCESS (USDT): Swept funds from User ID ${user.id}. Tx: ${sweepTx.hash}`);
                        await db('partial_deposits').where({ user_id: user.id, sweep_status: 'PENDING' }).update({ sweep_status: 'SWEPT', sweep_tx_hash: sweepTx.hash });
                    }
                }
                await delay(200);
                const residualBnbBalanceWei = await provider.getBalance(user.wallet_address);
                const residualBnbBalance = parseFloat(ethers.formatEther(residualBnbBalanceWei));
                if (residualBnbBalance >= MIN_SWEEP_AMOUNT_BNB) {
                    const feeData = await provider.getFeeData();
                    const gasPrice = feeData.gasPrice || ethers.parseUnits('3', 'gwei');
                    const gasLimit = 21000n;
                    const gasCostWei = gasLimit * gasPrice;
                    const amountToSweepWei = residualBnbBalanceWei - gasCostWei;
                    if (amountToSweepWei > 0) {
                        console.log(`[Sweeper] 🧹 Sweeping ${ethers.formatEther(amountToSweepWei)} residual BNB from User ID ${user.id}`);
                        const tx = await userWallet.sendTransaction({ to: MASTER_WALLET_ADDRESS, value: amountToSweepWei, gasPrice: gasPrice, gasLimit: gasLimit });
                        await tx.wait();
                        console.log(`[Sweeper] ✅ SUCCESS (BNB): Swept residual BNB from User ID ${user.id}. Tx: ${tx.hash}`);
                        await db('partial_deposits').where({ user_id: user.id, sweep_status: 'PENDING' }).update({ sweep_status: 'SWEPT', sweep_tx_hash: tx.hash });
                    }
                }
            } catch (innerError) {
                console.error(`[Sweeper] ❌ Error processing individual user ID ${user.id}:`, innerError.message);
                await db('partial_deposits').where({ user_id: user.id, sweep_status: 'PENDING' }).update({ sweep_status: 'FAILED' });
            }
        }
    } catch (error) {
        console.error(`[Sweeper] ❌ CRITICAL ERROR during fund sweeping part:`, error.message);
    }
}

module.exports = { 
    checkAndSweepDeposits,
    provider, 
    hotWallet 
};