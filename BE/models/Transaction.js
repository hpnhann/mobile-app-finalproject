import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
  transactionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'TransactionID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'UserID'
  },
  parentCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ParentCategoryID'
  },
  childCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ChildCategoryID'
  },
  walletId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'WalletID'
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
  tableName: 'Transactions',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  underscored: false
});

export default Transaction;
