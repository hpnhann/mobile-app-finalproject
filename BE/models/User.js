import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'UserID'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'FullName'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'Email'
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'PasswordHash'
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    field: 'Role'
  }
  // Tạm thời comment các field reset password
  // resetToken: {
  //   type: DataTypes.STRING(255),
  //   allowNull: true,
  //   field: 'ResetToken'
  // },
  // resetTokenExpires: {
  //   type: DataTypes.DATE,
  //   allowNull: true,
  //   field: 'ResetTokenExpires'
  // }
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  underscored: false
});

export default User;
