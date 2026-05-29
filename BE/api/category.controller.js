import { ParentCategory, ChildCategory } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';

// Lấy tất cả danh mục (có phân cấp)
export const getAllCategories = TryCatch(async (req, res) => {
  const parentCategories = await ParentCategory.findAll({
    include: [
      {
        model: ChildCategory,
        as: 'children',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId']
      }
    ],
    order: [['type', 'ASC'], ['name', 'ASC']]
  });

  res.json({ categories: parentCategories });
});

// Lấy danh mục theo loại (có phân cấp)
export const getCategoriesByType = TryCatch(async (req, res) => {
  const { type } = req.params;

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Loại danh mục không hợp lệ' });
  }

  const parentCategories = await ParentCategory.findAll({
    where: { type },
    include: [
      {
        model: ChildCategory,
        as: 'children',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId']
      }
    ],
    order: [['name', 'ASC']]
  });

  res.json({ categories: parentCategories });
});

// Lấy danh mục cha theo ID
export const getParentCategoryById = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  const parentCategory = await ParentCategory.findByPk(categoryId, {
    include: [
      {
        model: ChildCategory,
        as: 'children',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId']
      }
    ]
  });

  if (!parentCategory) {
    return res.status(404).json({ message: 'Danh mục cha không tồn tại' });
  }

  res.json({ category: parentCategory });
});

// Lấy danh mục con theo ID
export const getChildCategoryById = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  const childCategory = await ChildCategory.findByPk(categoryId, {
    include: [
      {
        model: ParentCategory,
        as: 'parent',
        attributes: ['parentCategoryId', 'name', 'type', 'icon']
      }
    ]
  });

  if (!childCategory) {
    return res.status(404).json({ message: 'Danh mục con không tồn tại' });
  }

  res.json({ category: childCategory });
});

// Tạo danh mục cha mới
export const createParentCategory = TryCatch(async (req, res) => {
  const { name, type, icon = '📝' } = req.body;

  // Kiểm tra danh mục cha đã tồn tại chưa
  const existingParent = await ParentCategory.findOne({ 
    where: { name, type } 
  });
  if (existingParent) {
    return res.status(400).json({ message: 'Danh mục cha đã tồn tại' });
  }

  // Tạo danh mục cha
  const parentCategory = await ParentCategory.create({ name, type, icon });

  res.status(201).json({
    message: 'Tạo danh mục cha thành công',
    category: parentCategory
  });
});

// Tạo danh mục con mới
export const createChildCategory = TryCatch(async (req, res) => {
  const { name, type, icon = '📝', parentCategoryId } = req.body;

  // Kiểm tra danh mục cha có tồn tại không
  const parentCategory = await ParentCategory.findByPk(parentCategoryId);
  if (!parentCategory) {
    return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
  }
  
  // Kiểm tra danh mục cha có cùng loại không
  if (parentCategory.type !== type) {
    return res.status(400).json({ message: 'Danh mục con phải cùng loại với danh mục cha' });
  }

  // Kiểm tra danh mục con đã tồn tại chưa
  const existingChild = await ChildCategory.findOne({ 
    where: { name, type, parentCategoryId } 
  });
  if (existingChild) {
    return res.status(400).json({ message: 'Danh mục con đã tồn tại' });
  }

  // Tạo danh mục con
  const childCategory = await ChildCategory.create({ 
    name, type, icon, parentCategoryId 
  });

  res.status(201).json({
    message: 'Tạo danh mục con thành công',
    category: childCategory
  });
});

// Cập nhật danh mục cha
export const updateParentCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;
  const { name, type, icon } = req.body;

  const parentCategory = await ParentCategory.findByPk(categoryId);
  if (!parentCategory) {
    return res.status(404).json({ message: 'Danh mục cha không tồn tại' });
  }

  // Kiểm tra danh mục đã tồn tại chưa (nếu thay đổi tên hoặc loại)
  if (name !== parentCategory.name || type !== parentCategory.type) {
    const existingCategory = await ParentCategory.findOne({ 
      where: { name, type } 
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'Danh mục cha đã tồn tại' });
    }
  }

  await parentCategory.update({ name, type, icon });

  res.json({
    message: 'Cập nhật danh mục cha thành công',
    category: parentCategory
  });
});

// Cập nhật danh mục con
export const updateChildCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;
  const { name, type, icon, parentCategoryId } = req.body;

  const childCategory = await ChildCategory.findByPk(categoryId);
  if (!childCategory) {
    return res.status(404).json({ message: 'Danh mục con không tồn tại' });
  }

  // Kiểm tra danh mục cha có tồn tại không (nếu thay đổi parentCategoryId)
  if (parentCategoryId && parentCategoryId !== childCategory.parentCategoryId) {
    const parentCategory = await ParentCategory.findByPk(parentCategoryId);
    if (!parentCategory) {
      return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
    }
    
    if (parentCategory.type !== type) {
      return res.status(400).json({ message: 'Danh mục con phải cùng loại với danh mục cha' });
    }
  }

  // Kiểm tra danh mục con đã tồn tại chưa (nếu thay đổi tên hoặc loại)
  if (name !== childCategory.name || type !== childCategory.type || parentCategoryId !== childCategory.parentCategoryId) {
    const existingCategory = await ChildCategory.findOne({ 
      where: { name, type, parentCategoryId: parentCategoryId || childCategory.parentCategoryId } 
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'Danh mục con đã tồn tại' });
    }
  }

  await childCategory.update({ name, type, icon, parentCategoryId: parentCategoryId || childCategory.parentCategoryId });

  res.json({
    message: 'Cập nhật danh mục con thành công',
    category: childCategory
  });
});

// Xóa danh mục cha (admin only) - với kiểm tra giao dịch
export const deleteParentCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  const parentCategory = await ParentCategory.findByPk(categoryId);
  if (!parentCategory) {
    return res.status(404).json({ message: 'Danh mục cha không tồn tại' });
  }

  // Kiểm tra xem danh mục cha có giao dịch nào không
  const { Transaction } = await import('../models/index.js');
  const transactionCount = await Transaction.count({
    where: { categoryId: categoryId }
  });

  if (transactionCount > 0) {
    return res.status(400).json({ 
      message: `Không thể xóa danh mục cha này vì có ${transactionCount} giao dịch đang sử dụng`,
      transactionCount: transactionCount
    });
  }

  // Xóa tất cả danh mục con trước
  await ChildCategory.destroy({
    where: { parentCategoryId: categoryId }
  });
  
  // Xóa danh mục cha
  await parentCategory.destroy();

  res.json({ message: 'Xóa danh mục cha thành công' });
});

// Xóa danh mục con (admin only) - với kiểm tra giao dịch
export const deleteChildCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  const childCategory = await ChildCategory.findByPk(categoryId);
  if (!childCategory) {
    return res.status(404).json({ message: 'Danh mục con không tồn tại' });
  }

  // Kiểm tra xem danh mục con có giao dịch nào không
  const { Transaction } = await import('../models/index.js');
  const transactionCount = await Transaction.count({
    where: { categoryId: categoryId }
  });

  if (transactionCount > 0) {
    return res.status(400).json({ 
      message: `Không thể xóa danh mục con này vì có ${transactionCount} giao dịch đang sử dụng`,
      transactionCount: transactionCount
    });
  }

  await childCategory.destroy();

  res.json({ message: 'Xóa danh mục con thành công' });
});

// Lấy danh mục cha (parent categories)
export const getParentCategories = TryCatch(async (req, res) => {
  const { type } = req.query;
  
  const whereClause = {};
  if (type && ['income', 'expense'].includes(type)) {
    whereClause.type = type;
  }

  const parentCategories = await ParentCategory.findAll({
    where: whereClause,
    include: [
      {
        model: ChildCategory,
        as: 'children',
        attributes: ['childCategoryId', 'name', 'type', 'icon', 'parentCategoryId']
      }
    ],
    order: [['type', 'ASC'], ['name', 'ASC']]
  });

  res.json({ categories: parentCategories });
});

// Lấy danh mục con theo danh mục cha
export const getChildCategories = TryCatch(async (req, res) => {
  const { parentCategoryId } = req.params;

  let whereClause = {};
  if (parentCategoryId && parentCategoryId !== '0') {
    whereClause = { parentCategoryId };
  }

  const childCategories = await ChildCategory.findAll({
    where: whereClause,
    include: [
      {
        model: ParentCategory,
        as: 'parent',
        attributes: ['parentCategoryId', 'name', 'type', 'icon']
      }
    ],
    order: [['parentCategoryId', 'ASC'], ['name', 'ASC']]
  });

  res.json({ categories: childCategories });
});

// Backward compatibility - tạo danh mục (tự động chọn cha hoặc con)
export const createCategory = TryCatch(async (req, res) => {
  const { name, type, icon = '📝', parentCategoryId = null } = req.body;

  if (parentCategoryId) {
    // Tạo danh mục con
    return createChildCategory(req, res);
  } else {
    // Tạo danh mục cha
    return createParentCategory(req, res);
  }
});

// Backward compatibility - cập nhật danh mục
export const updateCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;
  const { parentCategoryId } = req.body;

  // Kiểm tra xem là danh mục cha hay con
  const parentCategory = await ParentCategory.findByPk(categoryId);
  if (parentCategory) {
    return updateParentCategory(req, res);
  }

  const childCategory = await ChildCategory.findByPk(categoryId);
  if (childCategory) {
    return updateChildCategory(req, res);
  }

  return res.status(404).json({ message: 'Danh mục không tồn tại' });
});

// Backward compatibility - xóa danh mục
export const deleteCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  // Kiểm tra xem là danh mục cha hay con
  const parentCategory = await ParentCategory.findByPk(categoryId);
  if (parentCategory) {
    return deleteParentCategory(req, res);
  }

  const childCategory = await ChildCategory.findByPk(categoryId);
  if (childCategory) {
    return deleteChildCategory(req, res);
  }

  return res.status(404).json({ message: 'Danh mục không tồn tại' });
});

// Backward compatibility - lấy danh mục theo ID
export const getCategoryById = TryCatch(async (req, res) => {
  const { categoryId } = req.params;

  // Kiểm tra xem là danh mục cha hay con
  const parentCategory = await ParentCategory.findByPk(categoryId);
  if (parentCategory) {
    return getParentCategoryById(req, res);
  }

  const childCategory = await ChildCategory.findByPk(categoryId);
  if (childCategory) {
    return getChildCategoryById(req, res);
  }

  return res.status(404).json({ message: 'Danh mục không tồn tại' });
});