import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import { testConnection } from './config/database.js';

dotenv.config();

const createWalletsTable = async () => {
  try {
    await testConnection();
    console.log('✅ Connected to database');

    // Tạo bảng wallets
    const createWalletsTableQuery = `
      CREATE TABLE IF NOT EXISTS wallets (
        WalletID int NOT NULL AUTO_INCREMENT,
        UserID int NOT NULL,
        WalletName varchar(100) NOT NULL,
        InitialBalance decimal(15,2) NOT NULL DEFAULT 0.00,
        CurrentBalance decimal(15,2) NOT NULL DEFAULT 0.00,
        Month int NOT NULL,
        Year int NOT NULL,
        CreatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (WalletID),
        KEY UserID (UserID),
        UNIQUE KEY unique_wallet_per_month (UserID, WalletName, Month, Year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await sequelize.query(createWalletsTableQuery);
    console.log('✅ Created wallets table');

    // Tạo bảng wallet_transactions để theo dõi giao dịch của ví
    const createWalletTransactionsTableQuery = `
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        TransactionID int NOT NULL AUTO_INCREMENT,
        WalletID int NOT NULL,
        CategoryID int NOT NULL,
        Amount decimal(15,2) NOT NULL,
        TransactionDate date NOT NULL,
        Note text,
        CreatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (TransactionID),
        KEY WalletID (WalletID),
        KEY CategoryID (CategoryID),
        FOREIGN KEY (WalletID) REFERENCES wallets(WalletID) ON DELETE CASCADE,
        FOREIGN KEY (CategoryID) REFERENCES categories(CategoryID) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await sequelize.query(createWalletTransactionsTableQuery);
    console.log('✅ Created wallet_transactions table');

    console.log('🎉 Database structure updated successfully!');
    console.log('📋 New structure:');
    console.log('   - wallets: Quản lý các ví (Ví tiền mặt, Ví ngân hàng...)');
    console.log('   - wallet_transactions: Giao dịch thu/chi từ ví');
    console.log('   - categories: Danh mục thu/chi (Ăn uống, Đi lại...)');
    console.log('   - transactions: Giao dịch tổng (liên kết với ví và danh mục)');

  } catch (error) {
    console.error('❌ Error creating wallets table:', error);
  } finally {
    await sequelize.close();
  }
};

createWalletsTable();
