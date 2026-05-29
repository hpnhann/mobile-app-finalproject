import { Goal, User, Wallet, Transaction, ParentCategory, ChildCategory, sequelize } from "../models/index.js"
import { Op } from "sequelize"

// Tạo mục tiêu mới
export const createGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline, description } = req.body
    const userId = req.user.userId

    // Validation
    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc"
      })
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền mục tiêu phải lớn hơn 0"
      })
    }

    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Ngày hạn phải sau ngày hiện tại"
      })
    }

    const goal = await Goal.create({
      userId,
      title,
      targetAmount,
      currentAmount: 0,
      deadline,
      description: description || null
    })

    res.status(201).json({
      success: true,
      message: "Tạo mục tiêu thành công",
      goal
    })
  } catch (error) {
    console.error("Error creating goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo mục tiêu",
      error: error.message
    })
  }
}

// Lấy danh sách mục tiêu của user
export const getGoals = async (req, res) => {
  try {
    const userId = req.user.userId
    const { status, sortBy = 'deadline', sortOrder = 'ASC' } = req.query

    let whereClause = { userId }
    
    // Filter by status
    if (status) {
      const now = new Date()
      switch (status) {
        case 'active':
          whereClause.deadline = { [Op.gt]: now }
          break
        case 'completed':
          whereClause.currentAmount = { [Op.gte]: sequelize.col('targetAmount') }
          break
        case 'overdue':
          whereClause.deadline = { [Op.lt]: now }
          whereClause.currentAmount = { [Op.lt]: sequelize.col('targetAmount') }
          break
      }
    }

    const goals = await Goal.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'fullName', 'email']
      }]
    })

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const currentAmount = parseFloat(goal.currentAmount) || 0
      const targetAmount = parseFloat(goal.targetAmount) || 0
      const progress = Math.min((currentAmount / targetAmount) * 100, 100)
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const isCompleted = currentAmount >= targetAmount
      const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted

      return {
        ...goal.toJSON(),
        currentAmount: currentAmount,
        targetAmount: targetAmount,
        progress: Math.round(progress * 100) / 100,
        daysLeft,
        isCompleted,
        isOverdue
      }
    })

    res.json({
      success: true,
      goals: goalsWithProgress
    })
  } catch (error) {
    console.error("Error getting goals:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách mục tiêu",
      error: error.message
    })
  }
}

// Lấy mục tiêu theo ID
export const getGoalById = async (req, res) => {
  try {
    const { goalId } = req.params
    const userId = req.user.userId

    const goal = await Goal.findOne({
      where: { goalId, userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'fullName', 'email']
      }]
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mục tiêu"
      })
    }

    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const isCompleted = goal.currentAmount >= goal.targetAmount
    const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted

    res.json({
      success: true,
      goal: {
        ...goal.toJSON(),
        progress: Math.round(progress * 100) / 100,
        daysLeft,
        isCompleted,
        isOverdue
      }
    })
  } catch (error) {
    console.error("Error getting goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin mục tiêu",
      error: error.message
    })
  }
}

// Cập nhật mục tiêu
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const userId = req.user.userId
    const { title, targetAmount, deadline, description } = req.body

    const goal = await Goal.findOne({
      where: { goalId, userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mục tiêu"
      })
    }

    // Validation
    if (targetAmount && targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền mục tiêu phải lớn hơn 0"
      })
    }

    if (deadline && new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Ngày hạn phải sau ngày hiện tại"
      })
    }

    await goal.update({
      title: title || goal.title,
      targetAmount: targetAmount || goal.targetAmount,
      deadline: deadline || goal.deadline,
      description: description !== undefined ? description : goal.description
    })

    res.json({
      success: true,
      message: "Cập nhật mục tiêu thành công",
      goal
    })
  } catch (error) {
    console.error("Error updating goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật mục tiêu",
      error: error.message
    })
  }
}

// Xóa mục tiêu
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const userId = req.user.userId

    const goal = await Goal.findOne({
      where: { goalId, userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mục tiêu"
      })
    }

    await goal.destroy()

    res.json({
      success: true,
      message: "Xóa mục tiêu thành công"
    })
  } catch (error) {
    console.error("Error deleting goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa mục tiêu",
      error: error.message
    })
  }
}

// Nạp tiền vào mục tiêu
export const depositToGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const userId = req.user.userId
    const { amount, walletId } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp phải lớn hơn 0"
      })
    }

    if (!walletId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ví ngân sách"
      })
    }

    // Kiểm tra mục tiêu
    const goal = await Goal.findOne({
      where: { goalId, userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mục tiêu"
      })
    }

    // Kiểm tra ví ngân sách
    const wallet = await Wallet.findOne({
      where: { 
        walletId, 
        userId,
        walletType: 'budget'
      }
    })

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ví ngân sách"
      })
    }

    // Kiểm tra số dư ví
    const walletBalance = parseFloat(wallet.currentBalance) || 0
    const depositAmount = parseFloat(amount)

    if (walletBalance < depositAmount) {
      return res.status(400).json({
        success: false,
        message: "Số dư ví ngân sách không đủ"
      })
    }

    // Tìm category "Tiết kiệm" hoặc tạo mới
    let category = await ParentCategory.findOne({
      where: { name: 'Tiết kiệm', type: 'expense' }
    })

    if (!category) {
      category = await ParentCategory.create({
        name: 'Tiết kiệm',
        type: 'expense',
        icon: '💰'
      })
    }

    // Tạo giao dịch chi tiêu từ ví ngân sách
    const transaction = await Transaction.create({
      userId,
      parentCategoryId: category.parentCategoryId,
      walletId,
      amount: depositAmount,
      transactionDate: new Date().toISOString().split('T')[0],
      note: `Nạp vào mục tiêu: ${goal.title}`
    })

    // Cập nhật số dư ví ngân sách (trừ tiền)
    const newWalletBalance = walletBalance - depositAmount
    await wallet.update({ currentBalance: newWalletBalance })

    // Cập nhật mục tiêu (cộng tiền)
    const newCurrentAmount = parseFloat(goal.currentAmount) + depositAmount
    await goal.update({
      currentAmount: newCurrentAmount
    })

    const progress = Math.min((newCurrentAmount / goal.targetAmount) * 100, 100)
    const isCompleted = newCurrentAmount >= goal.targetAmount

    res.json({
      success: true,
      message: "Nạp tiền thành công",
      goal: {
        ...goal.toJSON(),
        currentAmount: newCurrentAmount,
        progress: Math.round(progress * 100) / 100,
        isCompleted
      }
    })
  } catch (error) {
    console.error("Error depositing to goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi nạp tiền",
      error: error.message
    })
  }
}

// Lấy thống kê mục tiêu
export const getGoalStats = async (req, res) => {
  try {
    const userId = req.user.userId

    const goals = await Goal.findAll({
      where: { userId }
    })

    const totalTargetAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount), 0)
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0)
    const completedGoals = goals.filter(goal => parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount)).length
    const activeGoals = goals.filter(goal => {
      const isCompleted = parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount)
      const isOverdue = new Date(goal.deadline) < new Date()
      return !isCompleted && !isOverdue
    }).length
    const overdueGoals = goals.filter(goal => {
      const isCompleted = parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount)
      const isOverdue = new Date(goal.deadline) < new Date()
      return !isCompleted && isOverdue
    }).length

    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

    res.json({
      success: true,
      stats: {
        totalGoals: goals.length,
        totalTargetAmount,
        totalCurrentAmount,
        completedGoals,
        activeGoals,
        overdueGoals,
        overallProgress: Math.round(overallProgress * 100) / 100,
        remainingAmount: totalTargetAmount - totalCurrentAmount
      }
    })
  } catch (error) {
    console.error("Error getting goal stats:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê mục tiêu",
      error: error.message
    })
  }
}

// Chi tiêu từ mục tiêu
export const spendFromGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const userId = req.user.userId
    const { amount, categoryId, note } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền chi tiêu phải lớn hơn 0"
      })
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn danh mục chi tiêu"
      })
    }

    // Kiểm tra mục tiêu
    const goal = await Goal.findOne({
      where: { goalId, userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mục tiêu"
      })
    }

    // Kiểm tra số dư mục tiêu
    const goalBalance = parseFloat(goal.currentAmount) || 0
    const spendAmount = parseFloat(amount)

    if (goalBalance < spendAmount) {
      return res.status(400).json({
        success: false,
        message: "Số dư mục tiêu không đủ"
      })
    }

    // Kiểm tra category - có thể là parent hoặc child category
    let parentCategoryId = null;
    let childCategoryId = null;
    let category = null;
    
    // Thử tìm trong child categories trước
    const childCategory = await ChildCategory.findOne({
      where: { childCategoryId: categoryId, type: 'expense' }
    });
    
    if (childCategory) {
      childCategoryId = categoryId;
      parentCategoryId = childCategory.parentCategoryId;
      category = childCategory;
    } else {
      // Nếu không tìm thấy trong child, thử tìm trong parent
      const parentCat = await ParentCategory.findOne({
        where: { parentCategoryId: categoryId, type: 'expense' }
      });
      
      if (parentCat) {
        parentCategoryId = categoryId;
        category = parentCat;
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục chi tiêu"
      })
    }

    // Tạo giao dịch chi tiêu (không cần walletId vì chi tiêu từ mục tiêu)
    const transaction = await Transaction.create({
      userId,
      parentCategoryId: parentCategoryId || null,
      childCategoryId: childCategoryId || null,
      walletId: null, // Chi tiêu từ mục tiêu không cần wallet
      amount: spendAmount,
      transactionDate: new Date().toISOString().split('T')[0],
      note: note || `Chi tiêu từ mục tiêu: ${goal.title}`
    })

    // Cập nhật mục tiêu (trừ tiền)
    const newCurrentAmount = goalBalance - spendAmount
    await goal.update({
      currentAmount: newCurrentAmount
    })

    const progress = Math.min((newCurrentAmount / goal.targetAmount) * 100, 100)
    const isCompleted = newCurrentAmount >= goal.targetAmount

    res.json({
      success: true,
      message: "Chi tiêu từ mục tiêu thành công",
      goal: {
        ...goal.toJSON(),
        currentAmount: newCurrentAmount,
        progress: Math.round(progress * 100) / 100,
        isCompleted
      },
      transaction
    })
  } catch (error) {
    console.error("Error spending from goal:", error)
    res.status(500).json({
      success: false,
      message: "Lỗi khi chi tiêu từ mục tiêu",
      error: error.message
    })
  }
}