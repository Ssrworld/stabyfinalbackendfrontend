// backend/src/scripts/payoutProcessor.js (FINAL AND CORRECTED WITH TYPE PARSING)

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
                // ✅✅✅ BUG FIX: Convert string decimals from DB to actual numbers first ✅✅✅
                const requestedAmount = parseFloat(wd.amount);
                const finalAmount = parseFloat(wd.final_amount);
                const adminFee = parseFloat(wd.admin_fee);

                try {
                    if (!wd.payout_wallet || !ethers.isAddress(wd.payout_wallet)) {
                        throw new Error(`Invalid or missing payout wallet for user ID ${wd.user_id}.`);
                    }

                    const amountToSend = ethers.parseUnits(finalAmount.toString(), USDT_DECIMALS);
                    
                    console.log(`[Payout] Processing withdrawal ID ${wd.id}: Sending ${finalAmount.toFixed(2)} USDT to ${wd.payout_wallet}`);

                    const tx = await usdtContract.transfer(wd.payout_wallet, amountToSend);
                    await tx.wait();
                    
                    await trx('withdrawals').where('id', wd.id).update({ 
                        status: 'COMPLETED',
                        completed_at: new Date(),
                        tx_hash: tx.hash
                    });
                    
                    if (adminFee > 0) {
                        await trx('admin_earnings').insert({
                            user_id: wd.user_id,
                            type: 'WITHDRAWAL_FEE',
                            amount: adminFee,
                            notes: `Fee for successful withdrawal #${wd.id} of $${requestedAmount.toFixed(2)}`
                        });
                        // ✅ Now this will work because 'adminFee' is a number
                        console.log(`[Payout] ✅ CREDITED: Admin earned $${adminFee.toFixed(2)} fee for withdrawal ID ${wd.id}.`);
                    }
                    
                    // ✅ Pass the numeric values to the email function
                    await sendWithdrawalSuccessEmail(wd.email, requestedAmount, finalAmount, adminFee, tx.hash);
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
                    
                    // ✅ Use the numeric value for the refund
                    await trx('users').where('id', wd.user_id).increment('withdrawable_balance', requestedAmount);
                    console.log(`[Payout] 🔄 REFUNDED: User ${wd.user_id} refunded ${requestedAmount.toFixed(2)}.`);
                    
                    // ✅ Pass the numeric value to the email function
                    await sendWithdrawalFailedEmail(wd.email, requestedAmount);
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