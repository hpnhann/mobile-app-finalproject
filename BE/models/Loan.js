import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Loan = sequelize.define('Loan', {
  loanId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    type: DataTypes.ENUM('borrow', 'lend'),
    allowNull: false,
    field: 'Type'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'Title'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Description'
  },
  principalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'PrincipalAmount'
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'RemainingAmount'
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'InterestRate'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'StartDate'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'DueDate'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'overdue'),
    allowNull: false,
    defaultValue: 'active',
    field: 'Status'
  },
  borrowerName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'BorrowerName'
  },
  lenderName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'LenderName'
  }
}, {
  tableName: 'Loans',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default Loan;
