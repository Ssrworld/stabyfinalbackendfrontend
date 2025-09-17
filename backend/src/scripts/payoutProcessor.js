// backend/src/scripts/payoutProcessor.js (UPDATED with fee crediting logic)

const path = require('path');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
}

const { ethers } = require('ethers');
const db = require('../config/db.config'); 
const { sendWithdrawalSuccessEmail, sendWithdrawalFailedEmail } = require('../services/email.service');
const { hotWallet } = require('./blockchainListener');

const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const USDT_DECIMALS = 18;

async function processPayouts() {
    if (!hotWallet) {
        console.warn("[Payout] HotWallet is not initialized. Skipping payout cycle.");
        throw new Error("HotWallet not initialized for Payout Processor.");
    }
    
    let hasEncounteredError = false;
    let firstErrorMessage = '';

    try {
        await db.transaction(async trx => {
            const pendingWithdrawals = await trx('withdrawals as w')
                .join('users as u', 'w.user_id', 'u.id')
                .select('w.id', 'w.user_id', 'w.amount', 'w.final_amount', 'w.admin_fee', 'u.payout_wallet', 'u.email')
                .where('w.status', 'PENDING')
                .forUpdate();

            if (pendingWithdrawals.length === 0) {
                return;
            }
            
            console.log(`[Payout] Found ${pendingWithdrawals.length} pending withdrawals to process.`);

            const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ['function transfer(address to, uint amount) returns (bool)'], hotWallet);

            for (const wd of pendingWithdrawals) {
                try {
                    if (!wd.payout_wallet || !ethers.isAddress(wd.payout_wallet)) {
                        throw new Error(`Invalid or missing payout wallet for user ID ${wd.user_id}.`);
                    }

                    const amountToSend = ethers.parseUnits(wd.final_amount.toString(), USDT_DECIMALS);
                    
                    console.log(`[Payout] Processing withdrawal ID ${wd.id}: Sending ${wd.final_amount} USDT to ${wd.payout_wallet}`);

                    const tx = await usdtContract.transfer(wd.payout_wallet, amountToSend);
                    await tx.wait();
                    
                    await trx('withdrawals').where('id', wd.id).update({ 
                        status: 'COMPLETED',
                        completed_at: new Date(),
                        tx_hash: tx.hash
                    });
                    
                    // ✅✅✅ THIS IS THE CRITICAL FIX ✅✅✅
                    // Credit the fee to the admin ONLY after a successful transaction
                    if (wd.admin_fee > 0) {
                        await trx('admin_earnings').insert({
                            user_id: wd.user_id,
                            type: 'WITHDRAWAL_FEE',
                            amount: wd.admin_fee,
                            notes: `Fee for successful withdrawal #${wd.id} of $${wd.amount}`
                        });
                        console.log(`[Payout] ✅ CREDITED: Admin earned $${wd.admin_fee.toFixed(2)} fee for withdrawal ID ${wd.id}.`);
                    }
                    
                    await sendWithdrawalSuccessEmail(wd.email, wd.amount, wd.final_amount, wd.admin_fee, tx.hash);
                    console.log(`[Payout] ✅ SUCCESS: Withdrawal ID ${wd.id} completed. Tx: ${tx.hash}`);

                } catch (error) {
                    console.error(`[Payout] ❌ FAILED to process Withdrawal ID ${wd.id}:`, error.message);
                    
                    hasEncounteredError = true;
                    if (!firstErrorMessage) {
                        firstErrorMessage = `Withdrawal ID ${wd.id}: ${error.message}`;
                    }

                    await trx('withdrawals').where('id', wd.id).update({ 
                        status: 'FAILED',
                        completed_at: new Date()
                    });
                    await trx('users').where('id', wd.user_id).increment('withdrawable_balance', wd.amount);
                    console.log(`[Payout] 🔄 REFUNDED: User ${wd.user_id} refunded ${wd.amount}.`);
                    
                    await sendWithdrawalFailedEmail(wd.email, wd.amount);
                }
            }
        });

        if (hasEncounteredError) {
            throw new Error(`One or more withdrawals failed to process. First error: ${firstErrorMessage}`);
        }

    } catch (error) {
        console.error("🔴 [Payout] CRITICAL ERROR during payout run:", error.message);
        throw error;
    }
}

module.exports = { processPayouts };