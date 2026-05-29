import express from 'express';
import {
  // New specific endpoints
  getAllCategories,
  getCategoriesByType,
  getParentCategoryById,
  getChildCategoryById,
  createParentCategory,
  createChildCategory,
  updateParentCategory,
  updateChildCategory,
  deleteParentCategory,
  deleteChildCategory,
  getParentCategories,
  getChildCategories,
  
  // Backward compatibility
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../api/category.controller.js';

const router = express.Router();

// New specific endpoints
router.get('/', getAllCategories);
router.get('/type/:type', getCategoriesByType);
router.get('/parents', getParentCategories);
router.get('/children', getChildCategories);
router.get('/children/:parentCategoryId', getChildCategories);
router.get('/parent/:categoryId', getParentCategoryById);
router.get('/child/:categoryId', getChildCategoryById);

router.post('/parent', createParentCategory);
router.post('/child', createChildCategory);
router.put('/parent/:categoryId', updateParentCategory);
router.put('/child/:categoryId', updateChildCategory);
router.delete('/parent/:categoryId', deleteParentCategory);
router.delete('/child/:categoryId', deleteChildCategory);

// Backward compatibility endpoints
router.post('/', createCategory);
router.put('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);
router.get('/:categoryId', getCategoryById);

export default router;