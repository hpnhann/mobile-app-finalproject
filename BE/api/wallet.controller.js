import { Wallet, ParentCategory, ChildCategory, Transaction, sequelize } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { Op } from 'sequelize';

// Lấy tất cả ví ngân sách của user
export const getWallets = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const wallets = await Wallet.findAll({
    where: { 
      userId, 
      month: currentMonth, 
      year: currentYear,
      walletType: 'budget' // Chỉ lấy ví ngân sách, không lấy ví đầu tư
    },
    order: [['createdAt', 'DESC']]
  });

  // Trả về ví với currentBalance từ database (đã được cập nhật bởi transaction controller)
  const walletsWithBalance = wallets.map(wallet => ({
    walletId: wallet.walletId,
    userId: wallet.userId,
    walletName: wallet.walletName,
    initialBalance: wallet.initialBalance,
    currentBalance: wallet.currentBalance, // Dùng currentBalance từ database
    walletType: wallet.walletType, // Thêm walletType
    month: wallet.month,
    year: wallet.year,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  }));

  res.json({ wallets: walletsWithBalance });
});

// Lấy ví đầu tư
export const getInvestmentWallets = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const wallets = await Wallet.findAll({
    where: { 
      userId, 
      month: currentMonth, 
      year: currentYear,
      walletType: 'investment' // Chỉ lấy ví đầu tư
    },
    order: [['createdAt', 'DESC']]
  });

  const walletsWithBalance = wallets.map(wallet => ({
    walletId: wallet.walletId,
    userId: wallet.userId,
    walletName: wallet.walletName,
    initialBalance: wallet.initialBalance,
    currentBalance: wallet.currentBalance,
    month: wallet.month,
    year: wallet.year,
    walletType: wallet.walletType,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  }));

  res.json({ wallets: walletsWithBalance });
});

// Lấy ví theo ID
export const getWalletById = TryCatch(async (req, res) => {
  const { walletId } = req.params;
  const { userId } = req.user;

  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });

  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  res.json({ wallet });
});

// Tạo ví mới (ngân sách hoặc đầu tư)
export const createWallet = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { walletName, initialBalance, month, year, walletType = 'budget' } = req.body;

  // Cho phép tạo ví trùng tên (đã bỏ validation)
  // const existingWallet = await Wallet.findOne({
  //   where: { userId, walletName, month, year, walletType }
  // });

  // if (existingWallet) {
  //   return res.status(400).json({ 
  //     message: 'Ví với tên này trong tháng/năm đã tồn tại' 
  //   });
  // }

  const wallet = await Wallet.create({
    userId,
    walletName,
    initialBalance,
    currentBalance: initialBalance,
    month,
    year,
    walletType
  });

  res.status(201).json({
    message: 'Tạo ví thành công',
    wallet
  });
});

// Cập nhật ví ngân sách
export const updateWallet = TryCatch(async (req, res) => {
  const { walletId } = req.params;
  const { userId } = req.user;
  const { walletName, initialBalance, month, year } = req.body;

  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });

  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  // Kiểm tra tên ví trùng lặp (trừ ví hiện tại)
  const existingWallet = await Wallet.findOne({
    where: { 
      userId, 
      walletName, 
      month, 
      year,
      walletId: { [Op.ne]: walletId }
    }
  });

  if (existingWallet) {
    return res.status(400).json({ 
      message: 'Ví với tên này trong tháng/năm đã tồn tại' 
    });
  }

  // Tính toán lại currentBalance dựa trên giao dịch
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const totalIncome = await Transaction.sum('amount', {
    where: {
      userId,
      transactionDate: { [Op.between]: [startDate, endDate] },
      note: { [Op.like]: `%${walletName}%` }
    },
    include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'income' }, required: false }]
  });

  const totalExpense = await Transaction.sum('amount', {
    where: {
      userId,
      transactionDate: { [Op.between]: [startDate, endDate] },
      note: { [Op.like]: `%${walletName}%` }
    },
    include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'expense' }, required: false }]
  });

  const newCurrentBalance = initialBalance + (totalIncome || 0) - (totalExpense || 0);

  await wallet.update({
    walletName,
    initialBalance,
    currentBalance: newCurrentBalance,
    month,
    year
  });

  res.json({
    message: 'Cập nhật ví thành công',
    wallet
  });
});

// Xóa ví ngân sách
export const deleteWallet = TryCatch(async (req, res) => {
  const { walletId } = req.params;
  const { userId } = req.user;

  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });

  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  await wallet.destroy();

  res.json({ message: 'Xóa ví thành công' });
});

// Lấy thống kê ví tổng quan
export const getWalletStats = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const totalInitialWalletAmount = await Wallet.sum('initialBalance', {
    where: { userId, month: currentMonth, year: currentYear }
  });

  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const totalIncome = await Transaction.sum('amount', {
    where: {
      userId,
      transactionDate: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'income' }, required: false }]
  });

  const totalExpense = await Transaction.sum('amount', {
    where: {
      userId,
      transactionDate: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'expense' }, required: false }]
  });

  const totalCurrentBalance = (totalInitialWalletAmount || 0) + (totalIncome || 0) - (totalExpense || 0);

  res.json({
    totalInitialWalletAmount: totalInitialWalletAmount || 0,
    totalIncome: totalIncome || 0,
    totalExpense: totalExpense || 0,
    totalCurrentBalance,
    month: currentMonth,
    year: currentYear
  });
});

// Lấy tiến độ ví (số dư hiện tại của từng ví)
export const getWalletProgress = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const wallets = await Wallet.findAll({
    where: { userId, month: currentMonth, year: currentYear },
    order: [['createdAt', 'DESC']]
  });

  const walletProgress = await Promise.all(
    wallets.map(async (wallet) => {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const totalIncome = await Transaction.sum('amount', {
        where: {
          userId,
          transactionDate: { [Op.between]: [startDate, endDate] },
          note: { [Op.like]: `%${wallet.walletName}%` }
        },
        include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'income' }, required: false }]
      });

      const totalExpense = await Transaction.sum('amount', {
        where: {
          userId,
          transactionDate: { [Op.between]: [startDate, endDate] },
          note: { [Op.like]: `%${wallet.walletName}%` }
        },
        include: [{ model: ParentCategory, as: 'parentCategory', where: { type: 'expense' }, required: false }]
      });

      const currentBalance = wallet.initialBalance + (totalIncome || 0) - (totalExpense || 0);

      return {
        walletId: wallet.walletId,
        walletName: wallet.walletName,
        initialBalance: wallet.initialBalance,
        currentBalance,
        month: wallet.month,
        year: wallet.year
      };
    })
  );

  res.json({
    wallets: walletProgress,
    month: currentMonth,
    year: currentYear
  });
});

// Chuyển tiền giữa các ví
export const transferBetweenWallets = TryCatch(async (req, res) => {
  const { fromWalletId, toWalletId, amount, note } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!fromWalletId || !toWalletId || !amount) {
    return res.status(400).json({
      message: 'Vui lòng cung cấp đầy đủ thông tin chuyển tiền'
    });
  }

  if (fromWalletId === toWalletId) {
    return res.status(400).json({
      message: 'Không thể chuyển tiền cho chính ví đó'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      message: 'Số tiền chuyển phải lớn hơn 0'
    });
  }

  // Kiểm tra ví nguồn
  const fromWallet = await Wallet.findOne({
    where: { walletId: fromWalletId, userId, walletType: 'budget' }
  });

  if (!fromWallet) {
    return res.status(404).json({
      message: 'Không tìm thấy ví nguồn'
    });
  }

  // Kiểm tra ví đích
  const toWallet = await Wallet.findOne({
    where: { walletId: toWalletId, userId, walletType: 'budget' }
  });

  if (!toWallet) {
    return res.status(404).json({
      message: 'Không tìm thấy ví đích'
    });
  }

  // Kiểm tra số dư ví nguồn
  const fromBalance = parseFloat(fromWallet.currentBalance) || 0;
  const transferAmount = parseFloat(amount);

  if (fromBalance < transferAmount) {
    return res.status(400).json({
      message: 'Số dư ví nguồn không đủ để chuyển'
    });
  }

  // Tìm hoặc tạo category "Chuyển tiền"
  let transferCategory = await ParentCategory.findOne({
    where: { name: 'Chuyển tiền', type: 'expense' }
  });

  if (!transferCategory) {
    transferCategory = await ParentCategory.create({
      name: 'Chuyển tiền',
      type: 'expense',
      icon: '💸'
    });
  }

  // Tìm hoặc tạo category "Nhận tiền"
  let receiveCategory = await ParentCategory.findOne({
    where: { name: 'Nhận tiền', type: 'income' }
  });

  if (!receiveCategory) {
    receiveCategory = await ParentCategory.create({
      name: 'Nhận tiền',
      type: 'income',
      icon: '💰'
    });
  }

  // Tạo giao dịch chi tiêu từ ví nguồn
  const expenseTransaction = await Transaction.create({
    userId,
    parentCategoryId: transferCategory.parentCategoryId,
    walletId: fromWalletId,
    amount: transferAmount,
    transactionDate: new Date().toISOString().split('T')[0],
    note: note || `Chuyển tiền đến ví: ${toWallet.walletName}`
  });

  // Tạo giao dịch thu nhập cho ví đích
  const incomeTransaction = await Transaction.create({
    userId,
    parentCategoryId: receiveCategory.parentCategoryId,
    walletId: toWalletId,
    amount: transferAmount,
    transactionDate: new Date().toISOString().split('T')[0],
    note: note || `Nhận tiền từ ví: ${fromWallet.walletName}`
  });

  // Cập nhật số dư ví nguồn (trừ tiền)
  const newFromBalance = fromBalance - transferAmount;
  await fromWallet.update({ currentBalance: newFromBalance });

  // Cập nhật số dư ví đích (cộng tiền)
  const toBalance = parseFloat(toWallet.currentBalance) || 0;
  const newToBalance = toBalance + transferAmount;
  await toWallet.update({ currentBalance: newToBalance });

  res.json({
    message: 'Chuyển tiền thành công',
    transfer: {
      fromWallet: {
        walletId: fromWallet.walletId,
        walletName: fromWallet.walletName,
        newBalance: newFromBalance
      },
      toWallet: {
        walletId: toWallet.walletId,
        walletName: toWallet.walletName,
        newBalance: newToBalance
      },
      amount: transferAmount,
      expenseTransaction,
      incomeTransaction
    }
  });
});