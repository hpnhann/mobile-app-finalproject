import { Budget, ParentCategory, ChildCategory, Transaction } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { Op } from 'sequelize';

// Lấy tất cả ngân sách của user
export const getBudgets = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  let whereClause = { userId };
  
  // Filter theo tháng/năm nếu có
  if (month) whereClause.month = month;
  if (year) whereClause.year = year;

  const budgets = await Budget.findAll({
    where: whereClause,
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      }
    ],
    order: [['year', 'DESC'], ['month', 'DESC']]
  });

  res.json({ budgets });
});

// Lấy ngân sách theo ID
export const getBudgetById = TryCatch(async (req, res) => {
  const { budgetId } = req.params;
  const { userId } = req.user;

  const budget = await Budget.findOne({
    where: { budgetId, userId },
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      }
    ]
  });

  if (!budget) {
    return res.status(404).json({ message: 'Ngân sách không tồn tại' });
  }

  res.json({ budget });
});

// Tạo ngân sách mới
export const createBudget = TryCatch(async (req, res) => {
  const { parentCategoryId, childCategoryId, amount, month, year } = req.body;
  const { userId } = req.user;

  // Kiểm tra ít nhất một trong hai category ID phải có
  if (!parentCategoryId && !childCategoryId) {
    return res.status(400).json({ message: 'Phải chọn danh mục cha hoặc danh mục con' });
  }

  // Kiểm tra category có tồn tại không
  let category = null;
  if (childCategoryId) {
    category = await ChildCategory.findByPk(childCategoryId);
  } else if (parentCategoryId) {
    category = await ParentCategory.findByPk(parentCategoryId);
  }

  if (!category) {
    return res.status(404).json({ message: 'Danh mục không tồn tại' });
  }

  // Kiểm tra ngân sách đã tồn tại chưa
  const existingBudget = await Budget.findOne({
    where: { 
      userId, 
      parentCategoryId: parentCategoryId || null,
      childCategoryId: childCategoryId || null,
      month, 
      year 
    }
  });

  if (existingBudget) {
    return res.status(400).json({ message: 'Ngân sách cho danh mục này đã tồn tại trong tháng/năm này' });
  }

  const budget = await Budget.create({
    userId,
    parentCategoryId: parentCategoryId || null,
    childCategoryId: childCategoryId || null,
    amount,
    month,
    year
  });

  res.status(201).json({
    message: 'Tạo ngân sách thành công',
    budget: {
      ...budget.toJSON(),
      category: category
    }
  });
});

// Cập nhật ngân sách
export const updateBudget = TryCatch(async (req, res) => {
  const { budgetId } = req.params;
  const { parentCategoryId, childCategoryId, amount, month, year } = req.body;
  const { userId } = req.user;

  const budget = await Budget.findOne({
    where: { budgetId, userId }
  });

  if (!budget) {
    return res.status(404).json({ message: 'Ngân sách không tồn tại' });
  }

  // Kiểm tra ít nhất một trong hai category ID phải có
  if (!parentCategoryId && !childCategoryId) {
    return res.status(400).json({ message: 'Phải chọn danh mục cha hoặc danh mục con' });
  }

  // Kiểm tra category có tồn tại không
  let category = null;
  if (childCategoryId) {
    category = await ChildCategory.findByPk(childCategoryId);
  } else if (parentCategoryId) {
    category = await ParentCategory.findByPk(parentCategoryId);
  }

  if (!category) {
    return res.status(404).json({ message: 'Danh mục không tồn tại' });
  }

  // Kiểm tra ngân sách đã tồn tại chưa (nếu thay đổi category hoặc tháng/năm)
  if (parentCategoryId !== budget.parentCategoryId || 
      childCategoryId !== budget.childCategoryId || 
      month !== budget.month || 
      year !== budget.year) {
    
    const existingBudget = await Budget.findOne({
      where: { 
        userId, 
        parentCategoryId: parentCategoryId || null,
        childCategoryId: childCategoryId || null,
        month, 
        year,
        budgetId: { [Op.ne]: budgetId }
      }
    });

    if (existingBudget) {
      return res.status(400).json({ message: 'Ngân sách cho danh mục này đã tồn tại trong tháng/năm này' });
    }
  }

  await budget.update({
    parentCategoryId: parentCategoryId || null,
    childCategoryId: childCategoryId || null,
    amount,
    month,
    year
  });

  res.json({
    message: 'Cập nhật ngân sách thành công',
    budget: {
      ...budget.toJSON(),
      category: category
    }
  });
});

// Xóa ngân sách
export const deleteBudget = TryCatch(async (req, res) => {
  const { budgetId } = req.params;
  const { userId } = req.user;

  const budget = await Budget.findOne({
    where: { budgetId, userId }
  });

  if (!budget) {
    return res.status(404).json({ message: 'Ngân sách không tồn tại' });
  }

  await budget.destroy();

  res.json({ message: 'Xóa ngân sách thành công' });
});

// Lấy thống kê ngân sách
export const getBudgetStats = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { month, year } = req.query;

  let whereClause = { userId };
  
  if (month) whereClause.month = month;
  if (year) whereClause.year = year;

  const budgets = await Budget.findAll({
    where: whereClause,
    include: [
      {
        model: ParentCategory,
        as: 'parentCategory',
        attributes: ['parentCategoryId', 'name', 'type', 'icon'],
        required: false
      },
      {
        model: ChildCategory,
        as: 'childCategory',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
        required: false,
        include: [
          {
            model: ParentCategory,
            as: 'parent',
            attributes: ['parentCategoryId', 'name', 'type', 'icon'],
            required: false
          }
        ]
      }
    ]
  });

  // Tính toán thống kê
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  // Thống kê theo danh mục
  const categoryStats = {};
  budgets.forEach(b => {
    const category = b.parentCategory || b.childCategory;
    if (category) {
      const categoryName = category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          name: categoryName,
          type: category.type,
          icon: category.icon,
          budgetAmount: 0,
          spentAmount: 0,
          remainingAmount: 0
        };
      }
      categoryStats[categoryName].budgetAmount += parseFloat(b.amount);
    }
  });

  // Tính số tiền đã chi cho mỗi danh mục
  for (const categoryName in categoryStats) {
    const category = Object.values(categoryStats[categoryName])[0];
    const categoryType = category.type;
    
    // Lấy tất cả giao dịch của danh mục này trong tháng/năm
    const transactions = await Transaction.findAll({
      where: {
        userId,
        [Op.or]: [
          { '$parentCategory.name$': categoryName },
          { '$childCategory.name$': categoryName }
        ],
        transactionDate: {
          [Op.and]: [
            { [Op.gte]: `${year}-${month.toString().padStart(2, '0')}-01` },
            { [Op.lt]: `${year}-${(month + 1).toString().padStart(2, '0')}-01` }
          ]
        }
      },
      include: [
        {
          model: ParentCategory,
          as: 'parentCategory',
          attributes: ['parentCategoryId', 'name', 'type', 'icon'],
          required: false
        },
        {
          model: ChildCategory,
          as: 'childCategory',
          attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId'],
          required: false
        }
      ]
    });

    const spentAmount = transactions
      .filter(t => {
        const cat = t.parentCategory || t.childCategory;
        return cat && cat.name === categoryName && cat.type === 'expense';
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    categoryStats[categoryName].spentAmount = spentAmount;
    categoryStats[categoryName].remainingAmount = categoryStats[categoryName].budgetAmount - spentAmount;
  }

  res.json({
    totalBudget,
    totalCategories: budgets.length,
    categoryStats: Object.values(categoryStats)
  });
});