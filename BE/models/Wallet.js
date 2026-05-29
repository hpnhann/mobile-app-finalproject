import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Wallet = sequelize.define('Wallet', {
  walletId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'WalletID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'UserID'
  },
  walletName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'WalletName'
  },
  initialBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'InitialBalance'
  },
  currentBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'CurrentBalance'
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Month'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Year'
  },
  walletType: {
    type: DataTypes.ENUM('budget', 'investment'),
    allowNull: false,
    defaultValue: 'budget',
    field: 'WalletType'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'UpdatedAt'
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default Wallet;
