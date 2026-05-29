import sequelize from '../config/database.js';
import User from './User.js';
import ParentCategory from './ParentCategory.js';
import ChildCategory from './ChildCategory.js';
import Transaction from './Transaction.js';
import Budget from './Budget.js';
import Goal from './Goal.js';
import Wallet from './Wallet.js';
import Loan from './Loan.js';
import LoanTransaction from './LoanTransaction.js';

// Define associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });
User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
User.hasMany(LoanTransaction, { foreignKey: 'userId', as: 'loanTransactions' });

// Parent-Child Category relationships
ParentCategory.hasMany(ChildCategory, { foreignKey: 'parentCategoryId', as: 'children' });
ChildCategory.belongsTo(ParentCategory, { foreignKey: 'parentCategoryId', as: 'parent' });

// Transaction and Budget relationships with categories
// Note: We'll use parentCategoryId or childCategoryId directly in transactions/budgets
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
Transaction.belongsTo(ParentCategory, { foreignKey: 'parentCategoryId', as: 'parentCategory' });
Transaction.belongsTo(ChildCategory, { foreignKey: 'childCategoryId', as: 'childCategory' });

Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Budget.belongsTo(ParentCategory, { foreignKey: 'parentCategoryId', as: 'parentCategory' });
Budget.belongsTo(ChildCategory, { foreignKey: 'childCategoryId', as: 'childCategory' });

Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions' });
Wallet.hasMany(Loan, { foreignKey: 'walletId', as: 'loans' });
Wallet.hasMany(LoanTransaction, { foreignKey: 'walletId', as: 'loanTransactions' });

Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Loan.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
Loan.hasMany(LoanTransaction, { foreignKey: 'loanId', as: 'transactions' });

LoanTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LoanTransaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
LoanTransaction.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });

export {
  sequelize,
  User,
  ParentCategory,
  ChildCategory,
  Transaction,
  Budget,
  Goal,
  Wallet,
  Loan,
  LoanTransaction
};
