import { Transaction, ParentCategory, ChildCategory, Wallet } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { Op } from 'sequelize';

// Tạo giao dịch mới
export const createTransaction = TryCatch(async (req, res) => {
  const { parentCategoryId, childCategoryId, walletId, amount, transactionDate, note } = req.body;
  const userId = req.user.userId;

  // Debug log
  console.log('Create transaction request:', {
    parentCategoryId,
    childCategoryId,
    walletId,
    amount,
    transactionDate,
    note,
    userId
  });

  // Kiểm tra ít nhất một trong hai category ID phải có
  if (!parentCategoryId && !childCategoryId) {
    return res.status(400).json({ message: 'Phải chọn danh mục cha hoặc danh mục con' });
  }

  // Kiểm tra category có tồn tại không
  let category = null;
  if (childCategoryId) {
    category = await ChildCategory.findByPk(childCategoryId);
  } else if (parentCategoryId) {
    category = await ParentCategory.findByPk(parentCategoryId);
  }

  if (!category) {
    return res.status(404).json({ message: 'Danh mục không tồn tại' });
  }

  // Kiểm tra wallet có tồn tại không
  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });
  
  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  // Tạo giao dịch
  const transaction = await Transaction.create({
    userId,
    parentCategoryId: parentCategoryId || null,
    childCategoryId: childCategoryId || null,
    walletId,
    amount,
    transactionDate,
    note
  });

  // Cập nhật số dư ví dựa trên loại giao dịch
  const currentBalance = parseFloat(wallet.currentBalance);
  const transactionAmount = parseFloat(amount);
  
  let newBalance;
  if (category.type === 'income') {
    // Thu nhập: cộng tiền vào ví
    newBalance = currentBalance + transactionAmount;
  } else {
    // Chi tiêu: trừ tiền khỏi ví
    newBalance = currentBalance - transactionAmount;
  }
  
  await wallet.update({ currentBalance: newBalance });

  res.status(201).json({
    message: 'Tạo giao dịch thành công',
    transaction: {
      ...transaction.toJSON(),
      category: category
    }
  });
});

// Lấy tất cả giao dịch của user
export const getAllTransactions = TryCatch(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;

  let whereClause = { userId };

  // Filter by type (income/expense)
  if (type && ['income', 'expense'].includes(type)) {
    whereClause[Op.or] = [
      { '$parentCategory.type$': type },
      { '$childCategory.type$': type }
    ];
  }

  // Filter by category name
  if (category) {
    whereClause[Op.or] = [
      { '$parentCategory.name$': { [Op.like]: `%${category}%` } },
      { '$childCategory.name$': { [Op.like]: `%${category}%` } }
    ];
  }

  // Filter by date range
  if (startDate && endDate) {
    whereClause.transactionDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const transactions = await Transaction.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      },
      {
        model: Wallet,
        as: 'wallet',
        attributes: ['walletId', 'walletName', 'walletType']
      }
    ],
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  res.json({
    transactions: transactions.rows,
    totalCount: transactions.count,
    totalPages: Math.ceil(transactions.count / parseInt(limit)),
    currentPage: parseInt(page)
  });
});

// Lấy giao dịch theo ID
export const getTransactionById = TryCatch(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.userId;

  const transaction = await Transaction.findOne({
    where: { transactionId, userId },
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      },
      {
        model: Wallet,
        as: 'wallet',
        attributes: ['walletId', 'walletName', 'walletType']
      }
    ]
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Giao dịch không tồn tại' });
  }

  res.json({ transaction });
});

// Cập nhật giao dịch
export const updateTransaction = TryCatch(async (req, res) => {
  const { transactionId } = req.params;
  const { parentCategoryId, childCategoryId, walletId, amount, transactionDate, note } = req.body;
  const userId = req.user.userId;

  const transaction = await Transaction.findOne({
    where: { transactionId, userId }
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Giao dịch không tồn tại' });
  }

  // Kiểm tra ít nhất một trong hai category ID phải có
  if (!parentCategoryId && !childCategoryId) {
    return res.status(400).json({ message: 'Phải chọn danh mục cha hoặc danh mục con' });
  }

  // Kiểm tra category có tồn tại không
  let category = null;
  if (childCategoryId) {
    category = await ChildCategory.findByPk(childCategoryId);
  } else if (parentCategoryId) {
    category = await ParentCategory.findByPk(parentCategoryId);
  }

  if (!category) {
    return res.status(404).json({ message: 'Danh mục không tồn tại' });
  }

  // Kiểm tra wallet có tồn tại không
  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });
  
  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  // Lưu thông tin cũ để tính toán
  const oldAmount = parseFloat(transaction.amount);
  const newAmount = parseFloat(amount);
  
  // Lấy category cũ để xác định loại giao dịch cũ
  let oldCategory = null;
  if (transaction.childCategoryId) {
    oldCategory = await ChildCategory.findByPk(transaction.childCategoryId);
  } else if (transaction.parentCategoryId) {
    oldCategory = await ParentCategory.findByPk(transaction.parentCategoryId);
  }

  // Cập nhật giao dịch
  await transaction.update({
    parentCategoryId: parentCategoryId || null,
    childCategoryId: childCategoryId || null,
    walletId,
    amount: newAmount,
    transactionDate,
    note
  });

  // Hoàn tác giao dịch cũ
  const currentBalance = parseFloat(wallet.currentBalance);
  let balanceAfterUndo = currentBalance;
  if (oldCategory) {
    if (oldCategory.type === 'income') {
      // Thu nhập cũ: trừ lại
      balanceAfterUndo = currentBalance - oldAmount;
    } else {
      // Chi tiêu cũ: cộng lại
      balanceAfterUndo = currentBalance + oldAmount;
    }
  }

  // Áp dụng giao dịch mới
  let newBalance;
  if (category.type === 'income') {
    // Thu nhập: cộng tiền vào ví
    newBalance = balanceAfterUndo + newAmount;
  } else {
    // Chi tiêu: trừ tiền khỏi ví
    newBalance = balanceAfterUndo - newAmount;
  }
  
  await wallet.update({ currentBalance: newBalance });

  res.json({
    message: 'Cập nhật giao dịch thành công',
    transaction
  });
});

// Xóa giao dịch
export const deleteTransaction = TryCatch(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.userId;

  const transaction = await Transaction.findOne({
    where: { transactionId, userId }
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Giao dịch không tồn tại' });
  }

  // Lấy ví và category để cập nhật số dư
  const wallet = await Wallet.findByPk(transaction.walletId);
  if (wallet) {
    // Lấy category để xác định loại giao dịch
    let category = null;
    if (transaction.childCategoryId) {
      category = await ChildCategory.findByPk(transaction.childCategoryId);
    } else if (transaction.parentCategoryId) {
      category = await ParentCategory.findByPk(transaction.parentCategoryId);
    }

    if (category) {
      const currentBalance = parseFloat(wallet.currentBalance);
      const transactionAmount = parseFloat(transaction.amount);
      
      let newBalance;
      if (category.type === 'income') {
        // Thu nhập: trừ lại số tiền
        newBalance = currentBalance - transactionAmount;
      } else {
        // Chi tiêu: cộng lại số tiền
        newBalance = currentBalance + transactionAmount;
      }
      
      await wallet.update({ currentBalance: newBalance });
    }
  }

  // Xóa giao dịch
  await transaction.destroy();

  res.json({ message: 'Xóa giao dịch thành công' });
});

// Lấy giao dịch theo ví
export const getTransactionsByWallet = TryCatch(async (req, res) => {
  const { walletId } = req.params;
  const userId = req.user.userId;

  // Kiểm tra ví có tồn tại không
  const wallet = await Wallet.findOne({
    where: { walletId, userId }
  });
  
  if (!wallet) {
    return res.status(404).json({ message: 'Ví không tồn tại' });
  }

  const transactions = await Transaction.findAll({
    where: { walletId, userId },
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      }
    ],
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']]
  });

  res.json({ transactions });
});

// Lấy thống kê giao dịch
export const getTransactionStats = TryCatch(async (req, res) => {
  const userId = req.user.userId;
  const { startDate, endDate } = req.query;

  let whereClause = { userId };

  if (startDate && endDate) {
    whereClause.transactionDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const transactions = await Transaction.findAll({
    where: whereClause,
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      }
    ]
  });

  // Tính toán thống kê
  const totalIncome = transactions
    .filter(t => {
      const category = t.parentCategory || t.childCategory;
      return category && category.type === 'income';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = transactions
    .filter(t => {
      const category = t.parentCategory || t.childCategory;
      return category && category.type === 'expense';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netAmount = totalIncome - totalExpense;

  // Thống kê theo danh mục
  const categoryStats = {};
  transactions.forEach(t => {
    const category = t.parentCategory || t.childCategory;
    if (category) {
      const categoryName = category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          type: category.type,
          icon: category.icon,
          amount: 0,
          count: 0
        };
      }
      categoryStats[categoryName].amount += parseFloat(t.amount);
      categoryStats[categoryName].count += 1;
    }
  });

  res.json({
    totalIncome,
    totalExpense,
    netAmount,
    totalTransactions: transactions.length,
    categoryStats: Object.values(categoryStats)
  });
});