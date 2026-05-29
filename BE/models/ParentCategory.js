import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ParentCategory = sequelize.define('ParentCategory', {
  parentCategoryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ParentCategoryID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'Name'
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    field: 'Type'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '📝',
    field: 'Icon'
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
  tableName: 'ParentCategories',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  underscored: false
});

export default ParentCategory;
