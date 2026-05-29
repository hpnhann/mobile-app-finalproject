import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Goal = sequelize.define('Goal', {
  goalId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'GoalID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'UserID'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'Title'
  },
  targetAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'TargetAmount'
  },
  currentAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'CurrentAmount'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'Deadline'
  }
}, {
  tableName: 'Goals',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  underscored: false
});

export default Goal;
