import { Transaction, ParentCategory, ChildCategory, Wallet, Goal, Loan, LoanTransaction, Budget } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Lấy báo cáo tổng quan
export const getOverviewReport = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  // Tạo điều kiện lọc theo ngày
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      transactionDate: {
        [Op.between]: [startDate, endDate]
      }
    };
  }

  // Thống kê giao dịch
  const totalTransactions = await Transaction.count({
    where: { userId, ...dateFilter }
  });

  const totalIncome = await Transaction.sum('amount', {
    where: { 
      userId, 
      ...dateFilter,
      [Op.or]: [
        { '$parentCategory.type$': 'income' },
        { '$childCategory.type$': 'income' }
      ]
    },
    include: [
      { model: ParentCategory, as: 'parentCategory', required: false },
      { model: ChildCategory, as: 'childCategory', required: false }
    ]
  });

  const totalExpense = await Transaction.sum('amount', {
    where: { 
      userId, 
      ...dateFilter,
      [Op.or]: [
        { '$parentCategory.type$': 'expense' },
        { '$childCategory.type$': 'expense' }
      ]
    },
    include: [
      { model: ParentCategory, as: 'parentCategory', required: false },
      { model: ChildCategory, as: 'childCategory', required: false }
    ]
  });

  // Thống kê ví
  const totalWallets = await Wallet.count({ where: { userId } });
  const totalWalletBalance = await Wallet.sum('currentBalance', { where: { userId } });

  // Thống kê mục tiêu
  const totalGoals = await Goal.count({ where: { userId } });
  const completedGoals = await Goal.count({ 
    where: { 
      userId,
      [Op.and]: [
        { currentAmount: { [Op.gte]: sequelize.col('targetAmount') } }
      ]
    } 
  });

  // Thống kê vay nợ
  const totalLoans = await Loan.count({ where: { userId } });
  const activeLoans = await Loan.count({ 
    where: { 
      userId, 
      status: 'active' 
    } 
  });

  // Thống kê ngân sách
  const totalBudgets = await Budget.count({ where: { userId } });

  res.json({
    overview: {
      totalTransactions: totalTransactions || 0,
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      netBalance: (totalIncome || 0) - (totalExpense || 0),
      totalWallets: totalWallets || 0,
      totalWalletBalance: totalWalletBalance || 0,
      totalGoals: totalGoals || 0,
      completedGoals: completedGoals || 0,
      totalLoans: totalLoans || 0,
      activeLoans: activeLoans || 0,
      totalBudgets: totalBudgets || 0
    }
  });
});

// Lấy báo cáo chi tiêu theo danh mục
export const getExpenseByCategoryReport = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      transactionDate: {
        [Op.between]: [startDate, endDate]
      }
    };
  }

  // Lấy tất cả giao dịch chi tiêu
  const expenseTransactions = await Transaction.findAll({
    where: { 
      userId, 
      ...dateFilter,
      [Op.or]: [
        { '$parentCategory.type$': 'expense' },
        { '$childCategory.type$': 'expense' }
      ]
    },
    include: [
      { 
        model: ParentCategory, 
        as: 'parentCategory', 
        required: false,
        attributes: ['parentCategoryId', 'name', 'type', 'icon']
      },
      { 
        model: ChildCategory, 
        as: 'childCategory', 
        required: false,
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
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

  // Nhóm theo danh mục
  const categoryStats = {};
  
  expenseTransactions.forEach(transaction => {
    const category = transaction.parentCategory || transaction.childCategory;
    if (category) {
      const categoryName = transaction.childCategory?.parent ? 
        `${transaction.childCategory.parent.name} - ${category.name}` : 
        category.name;
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          amount: 0,
          count: 0,
          icon: category.icon
        };
      }
      
      categoryStats[categoryName].amount += parseFloat(transaction.amount);
      categoryStats[categoryName].count += 1;
    }
  });

  // Tính tổng chi tiêu
  const totalExpense = Object.values(categoryStats).reduce((sum, cat) => sum + cat.amount, 0);

  // Tính phần trăm và sắp xếp
  const categoryList = Object.values(categoryStats).map(cat => ({
    ...cat,
    percentage: totalExpense > 0 ? (cat.amount / totalExpense * 100).toFixed(2) : 0
  })).sort((a, b) => b.amount - a.amount);

  res.json({
    totalExpense,
    categories: categoryList
  });
});

// Lấy báo cáo thu nhập theo danh mục
export const getIncomeByCategoryReport = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      transactionDate: {
        [Op.between]: [startDate, endDate]
      }
    };
  }

  // Lấy tất cả giao dịch thu nhập
  const incomeTransactions = await Transaction.findAll({
    where: { 
      userId, 
      ...dateFilter,
      [Op.or]: [
        { '$parentCategory.type$': 'income' },
        { '$childCategory.type$': 'income' }
      ]
    },
    include: [
      { 
        model: ParentCategory, 
        as: 'parentCategory', 
        required: false,
        attributes: ['parentCategoryId', 'name', 'type', 'icon']
      },
      { 
        model: ChildCategory, 
        as: 'childCategory', 
        required: false,
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
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

  // Nhóm theo danh mục
  const categoryStats = {};
  
  incomeTransactions.forEach(transaction => {
    const category = transaction.parentCategory || transaction.childCategory;
    if (category) {
      const categoryName = transaction.childCategory?.parent ? 
        `${transaction.childCategory.parent.name} - ${category.name}` : 
        category.name;
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          amount: 0,
          count: 0,
          icon: category.icon
        };
      }
      
      categoryStats[categoryName].amount += parseFloat(transaction.amount);
      categoryStats[categoryName].count += 1;
    }
  });

  // Tính tổng thu nhập
  const totalIncome = Object.values(categoryStats).reduce((sum, cat) => sum + cat.amount, 0);

  // Tính phần trăm và sắp xếp
  const categoryList = Object.values(categoryStats).map(cat => ({
    ...cat,
    percentage: totalIncome > 0 ? (cat.amount / totalIncome * 100).toFixed(2) : 0
  })).sort((a, b) => b.amount - a.amount);

  res.json({
    totalIncome,
    categories: categoryList
  });
});

// Lấy báo cáo theo tháng
export const getMonthlyReport = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { year = new Date().getFullYear() } = req.query;

  const monthlyData = [];

  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const income = await Transaction.sum('amount', {
      where: { 
        userId,
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        [Op.or]: [
          { '$parentCategory.type$': 'income' },
          { '$childCategory.type$': 'income' }
        ]
      },
      include: [
        { model: ParentCategory, as: 'parentCategory', required: false },
        { model: ChildCategory, as: 'childCategory', required: false }
      ]
    });

    const expense = await Transaction.sum('amount', {
      where: { 
        userId,
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        [Op.or]: [
          { '$parentCategory.type$': 'expense' },
          { '$childCategory.type$': 'expense' }
        ]
      },
      include: [
        { model: ParentCategory, as: 'parentCategory', required: false },
        { model: ChildCategory, as: 'childCategory', required: false }
      ]
    });

    monthlyData.push({
      month,
      monthName: startDate.toLocaleDateString('vi-VN', { month: 'long' }),
      income: income || 0,
      expense: expense || 0,
      balance: (income || 0) - (expense || 0)
    });
  }

  res.json({ monthlyData });
});

// Lấy báo cáo ví
export const getWalletReport = TryCatch(async (req, res) => {
  const { userId } = req.user;

  const wallets = await Wallet.findAll({
    where: { userId },
    include: [
      {
        model: Transaction,
        as: 'transactions',
        required: false,
        include: [
          { 
            model: ParentCategory, 
            as: 'parentCategory', 
            required: false,
            attributes: ['parentCategoryId', 'name', 'type', 'icon']
          },
          { 
            model: ChildCategory, 
            as: 'childCategory', 
            required: false,
            attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId']
          }
        ]
      }
    ]
  });

  const walletStats = wallets.map(wallet => {
    const transactions = wallet.transactions || [];
    const income = transactions
      .filter(t => (t.parentCategory?.type === 'income' || t.childCategory?.type === 'income'))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = transactions
      .filter(t => (t.parentCategory?.type === 'expense' || t.childCategory?.type === 'expense'))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      walletId: wallet.walletId,
      name: wallet.walletName,
      type: wallet.walletType,
      initialBalance: parseFloat(wallet.initialBalance),
      currentBalance: parseFloat(wallet.currentBalance),
      totalIncome: income,
      totalExpense: expense,
      transactionCount: transactions.length
    };
  });

  res.json({ wallets: walletStats });
});
