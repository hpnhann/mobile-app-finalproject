import dotenv from 'dotenv';
import { sequelize, Wallet } from './models/index.js';
import { testConnection } from './config/database.js';

dotenv.config();

const testWalletAPI = async () => {
  try {
    await testConnection();
    console.log('✅ Connected to database');

    // Lấy tất cả ví của user 3 (Hậu)
    const wallets = await Wallet.findAll({
      where: { userId: 3, month: 9, year: 2025 },
      order: [['createdAt', 'DESC']]
    });

    console.log('📋 Wallets found:', wallets.length);
    wallets.forEach(wallet => {
      console.log(`  - ${wallet.walletName}: ${wallet.initialBalance}₫ (Current: ${wallet.currentBalance}₫)`);
    });

    if (wallets.length === 0) {
      console.log('ℹ️ No wallets found. Creating a test wallet...');
      
      const testWallet = await Wallet.create({
        userId: 3,
        walletName: "Ví Test API",
        initialBalance: 500000,
        currentBalance: 500000,
        month: 9,
        year: 2025
      });
      
      console.log('✅ Test wallet created:', testWallet.toJSON());
    }

  } catch (error) {
    console.error('❌ Error testing wallet API:', error);
  } finally {
    await sequelize.close();
  }
};

testWalletAPI();
