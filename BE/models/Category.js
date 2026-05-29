import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  categoryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'CategoryID'
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
  parentCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ParentCategoryID'
  },
  isParent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'IsParent'
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
  tableName: 'Categories',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  underscored: false
});

export default Category;
