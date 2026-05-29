import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LoanTransaction = sequelize.define('LoanTransaction', {
  loanTransactionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'LoanTransactionID'
  },
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'LoanID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'UserID'
  },
  walletId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'WalletID'
  },
  type: {
    type: DataTypes.ENUM('payment', 'receipt'),
    allowNull: false,
    field: 'Type'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'Amount'
  },
  transactionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'TransactionDate'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Note'
  }
}, {
  tableName: 'LoanTransactions',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default LoanTransaction;
