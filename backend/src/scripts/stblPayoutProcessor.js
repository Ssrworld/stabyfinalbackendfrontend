// backend/src/scripts/stblPayoutProcessor.js

const path = require('path');
// --- समाधान: dotenv को केवल तभी लोड करें जब NODE_ENV 'production' न हो ---
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
}

const { ethers } = require('ethers');
const db = require('../config/db.config');
const { hotWallet, provider } = require('./blockchainListener'); // हॉट वॉलेट और प्रोवाइडर को इम्पोर्ट करें

const STBL_CONTRACT_ADDRESS = process.env.STBL_TOKEN_CONTRACT_ADDRESS;
const STBL_TOKEN_DECIMALS = parseInt(process.env.STBL_TOKEN_DECIMALS, 10) || 18;

// STBL टोकन भेजने के लिए ABI का एक छोटा सा हिस्सा
const STBL_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)"
];

async function processStblPayouts() {
    if (!hotWallet || !provider) {
        console.warn("[STBL Payout] HotWallet or Provider not initialized. Skipping cycle.");
        throw new Error("HotWallet/Provider not initialized for STBL Payout Processor.");
    }
    if (!STBL_CONTRACT_ADDRESS) {
        console.warn("[STBL Payout] STBL_TOKEN_CONTRACT_ADDRESS is not set in .env. Skipping cycle.");
        throw new Error("STBL_TOKEN_CONTRACT_ADDRESS not configured.");
    }

    let hasEncounteredError = false;
    let firstErrorMessage = '';

    try {
        await db.transaction(async trx => {
            // लंबित ट्रांसफर के लिए रिवॉर्ड्स प्राप्त करें
            const pendingRewards = await trx('stbl_token_rewards')
                .select('id', 'user_id', 'amount', 'payout_wallet_address')
                .where('status', 'PENDING_TRANSFER')
                .forUpdate();

            if (pendingRewards.length === 0) {
                console.log(`[STBL Payout] No pending STBL rewards to process. Cycle finished.`);
                return; // करने के लिए कुछ नहीं
            }

            console.log(`[STBL Payout] Found ${pendingRewards.length} pending STBL reward transfers.`);

            const stblContract = new ethers.Contract(STBL_CONTRACT_ADDRESS, STBL_ABI, hotWallet);

            for (const reward of pendingRewards) {
                try {
                    // सुनिश्चित करें कि वॉलेट पता और राशि मान्य हैं
                    if (!reward.payout_wallet_address || !ethers.isAddress(reward.payout_wallet_address)) {
                        throw new Error(`Invalid or missing payout address for reward ID ${reward.id}`);
                    }
                    
                    const amountToSend = ethers.parseUnits(reward.amount.toString(), STBL_TOKEN_DECIMALS);

                    console.log(`[STBL Payout] Sending ${reward.amount} STBL to ${reward.payout_wallet_address} for reward ID ${reward.id}...`);

                    // टोकन ट्रांसफर करें
                    const tx = await stblContract.transfer(reward.payout_wallet_address, amountToSend);
                    await tx.wait(); // ट्रांजैक्शन की पुष्टि की प्रतीक्षा करें

                    // डेटाबेस में रिकॉर्ड को अपडेट करें
                    await trx('stbl_token_rewards')
                        .where('id', reward.id)
                        .update({
                            status: 'TRANSFERRED',
                            tx_hash: tx.hash,
                            updated_at: new Date()
                        });

                    console.log(`[STBL Payout] ✅ SUCCESS: Reward ID ${reward.id} completed. Tx: ${tx.hash}`);

                } catch (error) {
                    console.error(`[STBL Payout] ❌ FAILED to process Reward ID ${reward.id}:`, error.message);
                    
                    hasEncounteredError = true;
                    if (!firstErrorMessage) {
                        firstErrorMessage = `Reward ID ${reward.id}: ${error.message}`;
                    }

                    // विफलता की स्थिति में, स्थिति को 'FAILED' पर सेट करें
                    await trx('stbl_token_rewards')
                        .where('id', reward.id)
                        .update({ 
                            status: 'FAILED',
                            updated_at: new Date()
                        });
                    console.log(`[STBL Payout] 🔄 Marked reward ID ${reward.id} as FAILED.`);
                }
            }
        });

        if (hasEncounteredError) {
            throw new Error(`One or more STBL rewards failed to process. First error: ${firstErrorMessage}`);
        }

    } catch (error) {
        console.error("🔴 [STBL Payout] CRITICAL ERROR during payout run:", error.message);
        throw error;
    }
}

module.exports = { processStblPayouts };