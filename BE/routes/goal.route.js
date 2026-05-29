import express from "express"
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  depositToGoal,
  spendFromGoal,
  getGoalStats
} from "../api/goal.controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Tất cả routes đều cần authentication
router.use(authenticateToken)

// CRUD operations
router.post("/", createGoal)                    // Tạo mục tiêu mới
router.get("/", getGoals)                       // Lấy danh sách mục tiêu
router.get("/stats", getGoalStats)              // Lấy thống kê mục tiêu
router.get("/:goalId", getGoalById)             // Lấy mục tiêu theo ID
router.put("/:goalId", updateGoal)              // Cập nhật mục tiêu
router.delete("/:goalId", deleteGoal)           // Xóa mục tiêu
router.post("/:goalId/deposit", depositToGoal)  // Nạp tiền vào mục tiêu
router.post("/:goalId/spend", spendFromGoal)    // Chi tiêu từ mục tiêu

export default router