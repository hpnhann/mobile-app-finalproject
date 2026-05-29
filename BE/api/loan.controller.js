import { Loan, LoanTransaction, Wallet, Transaction, ParentCategory, ChildCategory, sequelize } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { Op } from 'sequelize';

// Lấy tất cả khoản vay của user
export const getLoans = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { type, status } = req.query;

  const where = { userId };
  if (type) where.type = type;
  if (status) where.status = status;

  const loans = await Loan.findAll({
    where,
    include: [
      {
        model: Wallet,
        as: 'wallet',
        attributes: ['walletId', 'walletName', 'currentBalance']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Tính toán thông tin bổ sung
  const loansWithStats = await Promise.all(
    loans.map(async (loan) => {
      const totalPaid = await LoanTransaction.sum('amount', {
        where: { loanId: loan.loanId, type: 'payment' }
      }) || 0;

      const totalReceived = await LoanTransaction.sum('amount', {
        where: { loanId: loan.loanId, type: 'receipt' }
      }) || 0;

      const progress = loan.type === 'borrow' 
        ? (totalPaid / loan.principalAmount) * 100
        : (totalReceived / loan.principalAmount) * 100;

      const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status === 'active';

      return {
        ...loan.toJSON(),
        totalPaid,
        totalReceived,
        progress: Math.min(progress, 100),
        isOverdue
      };
    })
  );

  res.json({ loans: loansWithStats });
});

// Tạo khoản vay mới
export const createLoan = TryCatch(async (req, res) => {
  const { userId } = req.user;
  const { 
    walletId, 
    type, 
    title, 
    description, 
    principalAmount, 
    interestRate, 
    startDate, 
    dueDate, 
    borrowerName, 
    lenderName 
  } = req.body;

  // Kiểm tra ví có tồn tại không
  const wallet = await Wallet.findOne({
    where: { walletId, userId, walletType: 'budget' }
  });

  if (!wallet) {
    return res.status(404).json({ message: 'Không tìm thấy ví ngân sách' });
  }

  // Kiểm tra số dư ví (chỉ cho vay)
  if (type === 'lend') {
    const walletBalance = parseFloat(wallet.currentBalance) || 0;
    const loanAmount = parseFloat(principalAmount);

    if (walletBalance < loanAmount) {
      return res.status(400).json({ message: 'Số dư ví không đủ để cho vay' });
    }
  }

  // Tạo khoản vay
  const loan = await Loan.create({
    userId,
    walletId,
    type,
    title,
    description,
    principalAmount,
    remainingAmount: principalAmount,
    interestRate: interestRate || null,
    startDate,
    dueDate: dueDate || null,
    status: 'active',
    // borrowerName: Khi borrow = tên người cho vay, Khi lend = tên người vay
    borrowerName: borrowerName || null,
    lenderName: lenderName || null
  });

  // Tạo giao dịch tương ứng
  const transactionAmount = parseFloat(principalAmount);
  let categoryName, categoryType, transactionNote;

  if (type === 'borrow') {
    categoryName = 'Vay tiền';
    categoryType = 'income';
    transactionNote = `Vay tiền: ${title}`;
  } else {
    categoryName = 'Cho vay';
    categoryType = 'expense';
    transactionNote = `Cho vay: ${title}`;
  }

  // Tìm hoặc tạo category
  let category = await ParentCategory.findOne({
    where: { name: categoryName, type: categoryType }
  });

  if (!category) {
    category = await ParentCategory.create({
      name: categoryName,
      type: categoryType,
      icon: type === 'borrow' ? '💰' : '💸'
    });
  }

  // Tạo giao dịch
  const transaction = await Transaction.create({
    userId,
    parentCategoryId: category.parentCategoryId,
    walletId,
    amount: transactionAmount,
    transactionDate: startDate,
    note: transactionNote
  });

  // Cập nhật số dư ví
  const newBalance = type === 'borrow' 
    ? parseFloat(wallet.currentBalance) + transactionAmount
    : parseFloat(wallet.currentBalance) - transactionAmount;

  await wallet.update({ currentBalance: newBalance });

  res.status(201).json({
    message: 'Tạo khoản vay thành công',
    loan,
    transaction
  });
});

// Trả nợ / Thu nợ
export const makeLoanPayment = TryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { userId } = req.user;
  const { amount, note, transactionDate } = req.body;

  // Kiểm tra khoản vay
  const loan = await Loan.findOne({
    where: { loanId, userId },
    include: [{ model: Wallet, as: 'wallet' }]
  });

  if (!loan) {
    return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
  }

  if (loan.status !== 'active') {
    return res.status(400).json({ message: 'Khoản vay không còn hoạt động' });
  }

  const paymentAmount = parseFloat(amount);
  const remainingAmount = parseFloat(loan.remainingAmount);

  if (paymentAmount > remainingAmount) {
    return res.status(400).json({ message: 'Số tiền trả vượt quá số nợ còn lại' });
  }

  // Kiểm tra số dư ví (chỉ khi trả nợ)
  if (loan.type === 'borrow') {
    const walletBalance = parseFloat(loan.wallet.currentBalance) || 0;
    if (walletBalance < paymentAmount) {
      return res.status(400).json({ message: 'Số dư ví không đủ để trả nợ' });
    }
  }

  // Tạo giao dịch vay nợ
  const loanTransaction = await LoanTransaction.create({
    loanId,
    userId,
    walletId: loan.walletId,
    type: loan.type === 'borrow' ? 'payment' : 'receipt',
    amount: paymentAmount,
    transactionDate: transactionDate || new Date().toISOString().split('T')[0],
    note: note || `Trả nợ: ${loan.title}`
  });

  // Tạo giao dịch thường
  const categoryName = loan.type === 'borrow' ? 'Trả nợ' : 'Thu nợ';
  const categoryType = loan.type === 'borrow' ? 'expense' : 'income';

  let category = await ParentCategory.findOne({
    where: { name: categoryName, type: categoryType }
  });

  if (!category) {
    category = await ParentCategory.create({
      name: categoryName,
      type: categoryType,
      icon: loan.type === 'borrow' ? '💸' : '💰'
    });
  }

  const transaction = await Transaction.create({
    userId,
    parentCategoryId: category.parentCategoryId,
    walletId: loan.walletId,
    amount: paymentAmount,
    transactionDate: transactionDate || new Date().toISOString().split('T')[0],
    note: note || `${categoryName}: ${loan.title}`
  });

  // Cập nhật số dư ví
  const newBalance = loan.type === 'borrow'
    ? parseFloat(loan.wallet.currentBalance) - paymentAmount
    : parseFloat(loan.wallet.currentBalance) + paymentAmount;

  await loan.wallet.update({ currentBalance: newBalance });

  // Cập nhật số nợ còn lại
  const newRemainingAmount = remainingAmount - paymentAmount;
  const newStatus = newRemainingAmount <= 0 ? 'completed' : 'active';

  await loan.update({ 
    remainingAmount: newRemainingAmount,
    status: newStatus
  });

  res.json({
    message: 'Giao dịch thành công',
    loanTransaction,
    transaction,
    loan: {
      ...loan.toJSON(),
      remainingAmount: newRemainingAmount,
      status: newStatus
    }
  });
});

// Lấy lịch sử giao dịch của khoản vay
export const getLoanTransactions = TryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { userId } = req.user;

  const loan = await Loan.findOne({
    where: { loanId, userId }
  });

  if (!loan) {
    return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
  }

  const transactions = await LoanTransaction.findAll({
    where: { loanId },
    order: [['transactionDate', 'DESC']]
  });

  res.json({ transactions });
});

// Cập nhật khoản vay
export const updateLoan = TryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { userId } = req.user;
  const { 
    title, 
    description, 
    interestRate, 
    dueDate, 
    borrowerName, 
    lenderName 
  } = req.body;

  const loan = await Loan.findOne({
    where: { loanId, userId }
  });

  if (!loan) {
    return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
  }

  // Cập nhật thông tin
  // borrowerName: Khi borrow = tên người cho vay, Khi lend = tên người vay
  const updateFields = {
    title: title || loan.title,
    description: description !== undefined ? description : loan.description,
    interestRate: interestRate !== undefined ? (interestRate || null) : loan.interestRate,
    dueDate: dueDate !== undefined ? (dueDate || null) : loan.dueDate,
  };
  
  // Xử lý borrowerName: nếu có giá trị (kể cả null), cập nhật; nếu undefined, giữ nguyên
  if (borrowerName !== undefined) {
    // Nếu borrowerName là null, set null
    // Nếu borrowerName là string, trim và set (hoặc null nếu rỗng)
    if (borrowerName === null) {
      updateFields.borrowerName = null;
    } else if (typeof borrowerName === 'string') {
      const trimmed = borrowerName.trim();
      updateFields.borrowerName = trimmed || null;
    } else {
      updateFields.borrowerName = null;
    }
  }
  
  // Xử lý lenderName: nếu có giá trị (kể cả null), cập nhật; nếu undefined, giữ nguyên
  if (lenderName !== undefined) {
    updateFields.lenderName = lenderName && lenderName.trim() ? lenderName.trim() : null;
  }
  
  // Update trực tiếp với set và save
  if (updateFields.borrowerName !== undefined) {
    loan.set('borrowerName', updateFields.borrowerName);
  }
  
  // Update các field khác
  if (updateFields.title) loan.set('title', updateFields.title);
  if (updateFields.description !== undefined) loan.set('description', updateFields.description);
  if (updateFields.interestRate !== undefined) loan.set('interestRate', updateFields.interestRate);
  if (updateFields.dueDate !== undefined) loan.set('dueDate', updateFields.dueDate);
  
  // Save changes
  await loan.save();

  // Reload loan để lấy dữ liệu mới nhất từ database
  await loan.reload();

  res.json({
    message: 'Cập nhật khoản vay thành công',
    loan
  });
});

// Xóa khoản vay
export const deleteLoan = TryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { userId } = req.user;

  const loan = await Loan.findOne({
    where: { loanId, userId }
  });

  if (!loan) {
    return res.status(404).json({ message: 'Không tìm thấy khoản vay' });
  }

  if (loan.status === 'active' && parseFloat(loan.remainingAmount) > 0) {
    return res.status(400).json({ message: 'Không thể xóa khoản vay còn nợ' });
  }

  // Kiểm tra có giao dịch con không
  const transactionCount = await LoanTransaction.count({
    where: { loanId }
  });

  if (transactionCount > 0) {
    return res.status(400).json({ 
      message: 'Không thể xóa khoản vay đã có giao dịch. Vui lòng xóa các giao dịch trước.' 
    });
  }

  await loan.destroy();

  res.json({ message: 'Xóa khoản vay thành công' });
});

// Lấy thống kê vay nợ
export const getLoanStats = TryCatch(async (req, res) => {
  const { userId } = req.user;

  // Tổng số tiền đã vay (tổng principalAmount của tất cả khoản vay type 'borrow')
  const totalBorrowedPrincipal = await Loan.sum('principalAmount', {
    where: { userId, type: 'borrow' }
  }) || 0;

  // Tổng số tiền đã cho vay (tổng principalAmount của tất cả khoản vay type 'lend')
  const totalLentPrincipal = await Loan.sum('principalAmount', {
    where: { userId, type: 'lend' }
  }) || 0;

  // Số dư hiện tại còn nợ (tổng remainingAmount của các khoản vay type 'borrow' đang active)
  const activeBorrowed = await Loan.sum('remainingAmount', {
    where: { userId, type: 'borrow', status: 'active' }
  }) || 0;

  // Số dư hiện tại chưa thu (tổng remainingAmount của các khoản vay type 'lend' đang active)
  const activeLent = await Loan.sum('remainingAmount', {
    where: { userId, type: 'lend', status: 'active' }
  }) || 0;

  // Tổng số tiền vay hiện tại (tổng remainingAmount của tất cả khoản vay type 'borrow')
  const totalBorrowed = await Loan.sum('remainingAmount', {
    where: { userId, type: 'borrow' }
  }) || 0;

  // Tổng số tiền cho vay hiện tại (tổng remainingAmount của tất cả khoản vay type 'lend')
  const totalLent = await Loan.sum('remainingAmount', {
    where: { userId, type: 'lend' }
  }) || 0;

  const totalLoans = await Loan.count({
    where: { userId }
  });

  const activeLoans = await Loan.count({
    where: { userId, status: 'active' }
  });

  // Vị thế ròng = Tổng cho vay hiện tại - Tổng vay hiện tại (dựa trên remainingAmount)
  const netPosition = totalLent - totalBorrowed;

  res.json({
    totalBorrowed,
    totalLent,
    activeBorrowed,
    activeLent,
    totalLoans,
    activeLoans,
    netPosition
  });
});
