// Quick script to fix Nitikesh's credit balance
const { db } = require('./server/db.ts');
const { wallets, walletTransactions, users } = require('./shared/schema.ts');
const { eq } = require('drizzle-orm');

async function fixNitikeshCredits() {
  try {
    // Find Nitikesh's user record
    const nitikeshUser = await db.select().from(users).where(eq(users.email, 'nitikeshpro@gmail.com'));
    
    if (!nitikeshUser.length) {
      console.log('Nitikesh user not found');
      return;
    }
    
    const userId = nitikeshUser[0].id;
    console.log('Found Nitikesh user:', userId);
    
    // Get current wallet
    const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet.length) {
      console.log('Nitikesh wallet not found');
      return;
    }
    
    const currentBalance = parseFloat(wallet[0].balance);
    console.log('Current balance:', currentBalance);
    
    // Check recent transactions
    const recentTransactions = await db.select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(walletTransactions.createdAt, 'desc')
      .limit(10);
    
    console.log('Recent transactions:');
    recentTransactions.forEach(t => {
      console.log(`${t.createdAt}: ${t.type} ${t.amount} - ${t.description}`);
    });
    
    // If balance is 10 and should be 61 (11 + 50 referral reward), add the missing amount
    if (currentBalance < 60) {
      const correctBalance = 61;
      const amountToAdd = correctBalance - currentBalance;
      
      console.log(`Adding ${amountToAdd} credits to restore balance to ${correctBalance}`);
      
      // Update wallet balance
      await db.update(wallets)
        .set({ 
          balance: correctBalance.toFixed(2),
          totalEarned: (parseFloat(wallet[0].totalEarned) + amountToAdd).toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId));
      
      // Add transaction record
      await db.insert(walletTransactions).values({
        userId: userId,
        type: 'earn',
        amount: amountToAdd.toFixed(2),
        balanceBefore: currentBalance.toFixed(2),
        balanceAfter: correctBalance.toFixed(2),
        description: 'Manual correction - Referral reward fix',
        referenceType: 'manual_correction',
        referenceId: 'admin_fix_' + Date.now(),
        status: 'completed'
      });
      
      console.log('Balance corrected successfully');
    } else {
      console.log('Balance appears to be correct');
    }
    
  } catch (error) {
    console.error('Error fixing credits:', error);
  }
}

fixNitikeshCredits().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
