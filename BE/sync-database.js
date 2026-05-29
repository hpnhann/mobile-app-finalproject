import { sequelize, User, Transaction, Budget, Goal, Wallet, Loan, LoanTransaction, ParentCategory, ChildCategory } from './models/index.js';

const syncDatabase = async () => {
  try {
    console.log('🔄 Đang đồng bộ database...');
    
    // Sync tất cả models với alert: true để tạo bảng mới
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ Đồng bộ database thành công!');
    console.log('📋 Các bảng đã được tạo/cập nhật:');
    console.log('   - Users');
    console.log('   - Categories');
    console.log('   - Transactions');
    console.log('   - Budgets');
    console.log('   - Goals');
    console.log('   - Wallets');
    console.log('   - Loans');
    console.log('   - LoanTransactions');
    
    // Kiểm tra kết nối
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');
    
    // Kiểm tra bảng Loans
    const [results] = await sequelize.query("SHOW TABLES LIKE 'Loans'");
    if (results.length > 0) {
      console.log('✅ Bảng Loans đã được tạo thành công!');
    } else {
      console.log('⚠️ Bảng Loans chưa được tạo');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi đồng bộ database:', error);
    process.exit(1);
  }
};

syncDatabase();
