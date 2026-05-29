import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Budget = sequelize.define('Budget', {
  budgetId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'BudgetID'
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
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'Amount'
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
  }
}, {
  tableName: 'Budgets',
  timestamps: false
});

export default Budget;
