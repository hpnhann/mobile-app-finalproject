import dotenv from 'dotenv';
import { sequelize, Wallet } from './models/index.js';
import { testConnection } from './config/database.js';

dotenv.config();

const testNewWalletAPI = async () => {
  try {
    await testConnection();
    console.log('✅ Connected to database');

    // Test tạo ví mới
    const testWallet = {
      userId: 3, // User ID của Hậu
      walletName: "Ví tiền của Hậu",
      initialBalance: 1000000,
      month: 9,
      year: 2025
    };

    console.log('🧪 Testing wallet creation with data:', testWallet);

    // Tạo ví trực tiếp qua model
    const wallet = await Wallet.create(testWallet);
    console.log('✅ Wallet created successfully:', wallet.toJSON());

    // Kiểm tra ví đã được tạo
    const createdWallet = await Wallet.findOne({
      where: { walletId: wallet.walletId }
    });
    console.log('✅ Wallet found in database:', createdWallet.toJSON());

    // Lấy tất cả ví của user
    const userWallets = await Wallet.findAll({
      where: { userId: 3, month: 9, year: 2025 }
    });
    console.log('📋 All wallets for user 3:', userWallets.map(w => w.toJSON()));

  } catch (error) {
    console.error('❌ Error testing wallet API:', error);
  } finally {
    await sequelize.close();
  }
};

testNewWalletAPI();
