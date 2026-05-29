import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules cho User
export const validateUser = [
  body('fullName')
    .notEmpty()
    .withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải có từ 2-100 ký tự'),
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  handleValidationErrors
];

// Validation rules cho Transaction
export const validateTransaction = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Số tiền phải lớn hơn 0'),
  body('transactionDate')
    .isISO8601()
    .withMessage('Ngày giao dịch không hợp lệ'),
  body('walletId')
    .isInt({ min: 1 })
    .withMessage('Ví không hợp lệ'),
  body('parentCategoryId')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error('Danh mục cha không hợp lệ');
      }
      return true;
    }),
  body('childCategoryId')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error('Danh mục con không hợp lệ');
      }
      return true;
    }),
  body().custom((value, { req }) => {
    console.log('Transaction validation data:', value);
    if (!value.parentCategoryId && !value.childCategoryId) {
      throw new Error('Phải chọn ít nhất một danh mục (cha hoặc con)');
    }
    return true;
  }),
  handleValidationErrors
];

// Validation rules cho Budget
export const validateBudget = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Số tiền phải lớn hơn 0'),
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Tháng phải từ 1-12'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Năm không hợp lệ'),
  body('parentCategoryId')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error('Danh mục cha không hợp lệ');
      }
      return true;
    }),
  body('childCategoryId')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error('Danh mục con không hợp lệ');
      }
      return true;
    }),
  body().custom((value, { req }) => {
    console.log('Transaction validation data:', value);
    if (!value.parentCategoryId && !value.childCategoryId) {
      throw new Error('Phải chọn ít nhất một danh mục (cha hoặc con)');
    }
    return true;
  }),
  handleValidationErrors
];

// Validation rules cho Goal
export const validateGoal = [
  body('title')
    .notEmpty()
    .withMessage('Tiêu đề không được để trống')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tiêu đề phải có từ 1-100 ký tự'),
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Số tiền mục tiêu phải lớn hơn 0'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Ngày hết hạn không hợp lệ'),
  handleValidationErrors
];
