-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1:3306
-- Thời gian đã tạo: Th5 24, 2026 lúc 04:59 PM
-- Phiên bản máy phục vụ: 8.2.0
-- Phiên bản PHP: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `smart_finance`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `budgets`
--

DROP TABLE IF EXISTS `budgets`;
CREATE TABLE IF NOT EXISTS `budgets` (
  `BudgetID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `CategoryID` int NOT NULL,
  `Amount` decimal(15,2) NOT NULL,
  `Month` int NOT NULL,
  `Year` int NOT NULL,
  `ParentCategoryID` int DEFAULT NULL,
  `ChildCategoryID` int DEFAULT NULL,
  PRIMARY KEY (`BudgetID`),
  KEY `UserID` (`UserID`),
  KEY `CategoryID` (`CategoryID`),
  KEY `fk_budgets_parent_category` (`ParentCategoryID`),
  KEY `fk_budgets_child_category` (`ChildCategoryID`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `childcategories`
--

DROP TABLE IF EXISTS `childcategories`;
CREATE TABLE IF NOT EXISTS `childcategories` (
  `ChildCategoryID` int NOT NULL AUTO_INCREMENT,
  `ParentCategoryID` int NOT NULL,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 0xF09F939D,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ChildCategoryID`),
  KEY `ParentCategoryID` (`ParentCategoryID`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `childcategories`
--

INSERT INTO `childcategories` (`ChildCategoryID`, `ParentCategoryID`, `Name`, `Type`, `Icon`, `CreatedAt`, `UpdatedAt`) VALUES
(16, 39, 'Lương cơ bản', 'income', '💼', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(17, 39, 'Lương tháng 13', 'income', '🎊', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(18, 39, 'Lương làm thêm', 'income', '⏰', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(19, 41, 'Ăn sáng', 'expense', '🌅', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(20, 41, 'Ăn trưa', 'expense', '☀️', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(21, 41, 'Ăn tối', 'expense', '🌙', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(22, 41, 'Cà phê', 'expense', '☕', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(23, 63, 'Xăng xe', 'expense', '⛽', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(24, 63, 'Taxi/Grab', 'expense', '🚕', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(25, 63, 'Xe buýt', 'expense', '🚌', '2025-10-14 10:58:02', '2025-10-14 10:58:02');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `goals`
--

DROP TABLE IF EXISTS `goals`;
CREATE TABLE IF NOT EXISTS `goals` (
  `GoalID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TargetAmount` decimal(15,2) NOT NULL,
  `CurrentAmount` decimal(15,2) DEFAULT '0.00',
  `Deadline` date DEFAULT NULL,
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime NOT NULL,
  PRIMARY KEY (`GoalID`),
  KEY `UserID` (`UserID`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `goals`
--

INSERT INTO `goals` (`GoalID`, `UserID`, `Title`, `TargetAmount`, `CurrentAmount`, `Deadline`, `CreatedAt`, `UpdatedAt`) VALUES
(6, 3, 'Mua lap top mới ', 2000000.00, 1000100.00, '2025-09-30', '2025-09-14 15:32:23', '2025-09-30 12:48:02'),
(7, 8, 'test', 1000000.00, 700000.00, '2025-10-03', '2025-10-02 23:49:47', '2025-10-05 10:24:56'),
(8, 8, 'test2', 1000000.00, 100000.00, '2025-11-29', '2025-11-19 12:59:28', '2025-11-19 13:08:08'),
(10, 8, 'Mua do tetttt', 1000000.00, 200100.00, '2026-02-17', '2026-01-17 16:50:50', '2026-01-17 17:04:20');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loans`
--

DROP TABLE IF EXISTS `loans`;
CREATE TABLE IF NOT EXISTS `loans` (
  `LoanID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `WalletID` int NOT NULL,
  `Type` enum('borrow','lend') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `PrincipalAmount` decimal(15,2) NOT NULL,
  `RemainingAmount` decimal(15,2) NOT NULL,
  `InterestRate` decimal(5,2) DEFAULT NULL,
  `StartDate` date NOT NULL,
  `DueDate` date DEFAULT NULL,
  `Status` enum('active','completed','overdue') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `BorrowerName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LenderName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`LoanID`),
  KEY `idx_user_id` (`UserID`),
  KEY `idx_wallet_id` (`WalletID`),
  KEY `idx_type` (`Type`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `loans`
--

INSERT INTO `loans` (`LoanID`, `UserID`, `WalletID`, `Type`, `Title`, `Description`, `PrincipalAmount`, `RemainingAmount`, `InterestRate`, `StartDate`, `DueDate`, `Status`, `BorrowerName`, `LenderName`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 8, 12, 'lend', 'Test', 'test', 200000.00, 100000.00, NULL, '2025-10-06', '2025-10-31', 'active', NULL, 'Người cho vay', '2025-10-05 10:59:36', '2025-10-05 11:18:00'),
(2, 8, 13, 'borrow', 'Vay mua xee', 'a', 200000.00, 100000.00, NULL, '2025-10-06', '2025-10-31', 'active', 'Người vay', NULL, '2025-10-05 11:00:31', '2025-10-05 11:18:00'),
(3, 8, 12, 'lend', 'test', 'test', 200000.00, 0.00, NULL, '2025-10-05', NULL, 'completed', 'aaaaaaaa', 'aaaaaaaa', '2025-10-05 11:14:07', '2025-10-05 11:24:51'),
(4, 8, 13, 'borrow', 'a', 'a', 200000.00, 200000.00, NULL, '2025-10-05', NULL, 'active', 'Hậuuuu', 'Hậuuuu', '2025-10-05 11:19:19', '2025-10-05 11:25:02'),
(5, 8, 14, 'lend', 'bbb', 'aaa', 200000.00, 200000.00, NULL, '2025-11-11', '2025-11-13', 'active', 'Hậuuuu', NULL, '2025-11-11 12:58:36', '2025-11-11 13:14:35'),
(6, 8, 14, 'lend', 'test', 'aaa', 200000.00, 200000.00, NULL, '2025-11-11', NULL, 'active', 'Hậuuuu', NULL, '2025-11-11 13:15:05', '2025-11-11 13:16:20'),
(7, 8, 14, 'lend', 'testtt', 'aaa', 200000.00, 200000.00, NULL, '2025-11-11', NULL, 'active', 'Hậu', NULL, '2025-11-11 13:16:36', '2025-11-11 13:31:14'),
(8, 8, 20, 'borrow', 'Cho Vay test', 'testt', 1000000.00, 500000.00, NULL, '2026-01-20', '2026-08-01', 'active', 'Anh A', NULL, '2026-01-20 12:38:54', '2026-01-20 12:39:23'),
(9, 8, 20, 'lend', 'CHo anh B Vay', NULL, 500000.00, 400000.00, NULL, '2026-01-20', '2026-10-01', 'active', 'Anh B', NULL, '2026-01-20 12:40:07', '2026-01-20 12:40:43');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loantransactions`
--

DROP TABLE IF EXISTS `loantransactions`;
CREATE TABLE IF NOT EXISTS `loantransactions` (
  `LoanTransactionID` int NOT NULL AUTO_INCREMENT,
  `LoanID` int NOT NULL,
  `UserID` int NOT NULL,
  `WalletID` int NOT NULL,
  `Type` enum('payment','receipt') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Amount` decimal(15,2) NOT NULL,
  `TransactionDate` date NOT NULL,
  `Note` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`LoanTransactionID`),
  KEY `idx_loan_id` (`LoanID`),
  KEY `idx_user_id` (`UserID`),
  KEY `idx_wallet_id` (`WalletID`),
  KEY `idx_type` (`Type`),
  KEY `idx_transaction_date` (`TransactionDate`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `loantransactions`
--

INSERT INTO `loantransactions` (`LoanTransactionID`, `LoanID`, `UserID`, `WalletID`, `Type`, `Amount`, `TransactionDate`, `Note`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 2, 8, 13, 'payment', 100000.00, '2025-10-05', 'Trả nợ: Vay mua xê', '2025-10-05 11:07:31', '2025-10-05 11:07:31'),
(2, 1, 8, 12, 'receipt', 100000.00, '2025-10-05', 'Trả nợ: Cho Hậu vay', '2025-10-05 11:07:51', '2025-10-05 11:07:51'),
(3, 3, 8, 12, 'receipt', 200000.00, '2025-10-05', 'a', '2025-10-05 11:14:43', '2025-10-05 11:14:43'),
(4, 8, 8, 20, 'payment', 500000.00, '2026-01-20', 'Trả nợ: Cho Vay test', '2026-01-20 12:39:23', '2026-01-20 12:39:23'),
(5, 9, 8, 20, 'receipt', 100000.00, '2026-01-20', 'Trả nợ: CHo anh B Vay', '2026-01-20 12:40:43', '2026-01-20 12:40:43');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `parentcategories`
--

DROP TABLE IF EXISTS `parentcategories`;
CREATE TABLE IF NOT EXISTS `parentcategories` (
  `ParentCategoryID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 0xF09F939D,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ParentCategoryID`)
) ENGINE=MyISAM AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `parentcategories`
--

INSERT INTO `parentcategories` (`ParentCategoryID`, `Name`, `Type`, `Icon`, `CreatedAt`, `UpdatedAt`) VALUES
(39, 'Lương', 'income', '💰', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(40, 'Thưởng', 'income', '🎁', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(41, 'Ăn uống', 'expense', '🍕', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(42, 'Grab', 'expense', '🚗', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(43, 'Đi chợ', 'expense', '🛍️', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(44, 'Thu nhập phụ', 'income', '💼', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(45, 'Quà tặng', 'income', '🎁', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(46, 'Hóa đơn', 'expense', '📄', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(47, 'Giáo dục', 'expense', '📚', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(48, 'Nhà ở', 'expense', '🏠', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(49, 'Điện thoại', 'expense', '📱', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(50, 'Internet', 'expense', '🌐', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(51, 'Bảo hiểm', 'expense', '🛡️', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(52, 'Tiết kiệm', 'income', '💎', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(53, 'Lãi ngân hàng', 'income', '🏦', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(54, 'Ví Đầu Tư', 'income', '💼', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(55, 'Chi từ Ví Đầu Tư', 'expense', '💸', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(56, 'Chuyển tiền', 'expense', '💸', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(57, 'Cho vay', 'expense', '💸', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(58, 'Vay tiền', 'income', '💰', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(59, 'Trả nợ', 'expense', '💸', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(60, 'Thu nợ', 'income', '💰', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(61, 'Tiền ăn', 'expense', '🍽️', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(62, 'Di chuyển', 'expense', '🚗', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(63, 'Mua sắm', 'expense', '🛍️', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(64, 'Giải trí', 'expense', '🎬', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(65, 'Y tế', 'expense', '🏥', '2025-10-14 10:58:02', '2025-10-14 10:58:02'),
(66, 'Đầu tư', 'income', '📈', '2025-10-14 10:58:02', '2025-10-14 11:53:26'),
(68, 'Tiết kiệm', 'expense', '💰', '2025-11-19 05:59:53', '2025-11-19 05:59:53');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `transactions`
--

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE IF NOT EXISTS `transactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `CategoryID` int NOT NULL,
  `Amount` decimal(15,2) NOT NULL,
  `TransactionDate` date NOT NULL,
  `Note` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime NOT NULL,
  `WalletID` int DEFAULT NULL,
  `ParentCategoryID` int DEFAULT NULL,
  `ChildCategoryID` int DEFAULT NULL,
  PRIMARY KEY (`TransactionID`),
  KEY `idx_wallet_id` (`WalletID`),
  KEY `UserID` (`UserID`),
  KEY `CategoryID` (`CategoryID`),
  KEY `fk_transactions_parent_category` (`ParentCategoryID`),
  KEY `fk_transactions_child_category` (`ChildCategoryID`)
) ENGINE=MyISAM AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `transactions`
--

INSERT INTO `transactions` (`TransactionID`, `UserID`, `CategoryID`, `Amount`, `TransactionDate`, `Note`, `CreatedAt`, `UpdatedAt`, `WalletID`, `ParentCategoryID`, `ChildCategoryID`) VALUES
(22, 3, 1, 500000.00, '2025-09-14', '(Từ ví: Ví tiền của Hậu)', '2025-09-14 15:03:51', '2025-09-14 15:03:51', 1, NULL, NULL),
(23, 3, 1, 10000000.00, '2025-09-14', '(Từ ví: Ví để đầu tư)', '2025-09-14 15:30:00', '2025-09-14 15:30:00', 6, NULL, NULL),
(24, 3, 30, 100000.00, '2025-09-14', 'Nạp vào mục tiêu: Mua lap top mới ', '2025-09-14 15:32:36', '2025-09-14 15:32:36', 6, NULL, NULL),
(25, 3, 30, 900000.00, '2025-09-14', 'Nạp vào mục tiêu: Mua lap top mới ', '2025-09-14 15:36:17', '2025-09-14 15:36:17', 6, NULL, NULL),
(26, 3, 7, 100000.00, '2025-09-14', 'test', '2025-09-14 15:40:20', '2025-09-14 15:40:20', NULL, NULL, NULL),
(27, 3, 22, 100000.00, '2025-09-14', 'test', '2025-09-14 15:41:05', '2025-09-14 15:41:05', NULL, NULL, NULL),
(28, 3, 9, 100000.00, '2025-09-14', 'ăn bún bòa (Từ ví: Ví tiền của Hậu2)', '2025-09-14 15:54:42', '2025-09-14 15:54:42', 4, NULL, NULL),
(29, 3, 7, 100000.00, '2025-09-14', 'mua chuột cho laptop', '2025-09-14 15:56:13', '2025-09-14 15:56:13', NULL, NULL, NULL),
(30, 3, 30, 100.00, '2025-09-30', 'Nạp vào mục tiêu: Mua lap top mới ', '2025-09-30 12:44:40', '2025-09-30 12:44:40', 6, NULL, NULL),
(31, 3, 30, 100000.00, '2025-09-30', 'Nạp vào mục tiêu: Mua lap top mới ', '2025-09-30 12:47:52', '2025-09-30 12:47:52', 6, NULL, NULL),
(32, 3, 30, 200000.00, '2025-09-30', 'Nạp vào mục tiêu: Mua lap top mới ', '2025-09-30 12:48:02', '2025-09-30 12:48:02', 6, NULL, NULL),
(68, 8, 0, 100000.00, '2026-01-20', 'Thu nợ: CHo anh B Vay', '2026-01-20 12:40:43', '2026-01-20 12:40:43', 20, 60, NULL),
(60, 8, 0, 100000.00, '2026-01-16', 'hhee', '2026-01-16 15:03:07', '2026-01-16 15:08:39', 18, NULL, 16),
(61, 8, 0, 100.00, '2026-01-17', 'Nạp vào mục tiêu: Mua do tetttt', '2026-01-17 17:00:27', '2026-01-17 17:00:27', 20, 68, NULL),
(62, 8, 0, 100000.00, '2026-01-17', 'Nạp vào mục tiêu: Mua do tetttt', '2026-01-17 17:03:54', '2026-01-17 17:03:54', 20, 68, NULL),
(63, 8, 0, 200000.00, '2026-01-17', 'Nạp vào mục tiêu: Mua do tetttt', '2026-01-17 17:04:05', '2026-01-17 17:04:05', 20, 68, NULL),
(64, 8, 0, 100000.00, '2026-01-17', 'Chi tiêu từ mục tiêu: Mua do tetttt', '2026-01-17 17:04:20', '2026-01-17 17:04:20', NULL, 41, NULL),
(65, 8, 0, 1000000.00, '2026-01-20', 'Vay tiền: Cho Vay test', '2026-01-20 12:38:54', '2026-01-20 12:38:54', 20, 58, NULL),
(66, 8, 0, 500000.00, '2026-01-20', 'Trả nợ: Cho Vay test', '2026-01-20 12:39:23', '2026-01-20 12:39:23', 20, 59, NULL),
(67, 8, 0, 500000.00, '2026-01-20', 'Cho vay: CHo anh B Vay', '2026-01-20 12:40:07', '2026-01-20 12:40:07', 20, 57, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Role` enum('admin','user') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime NOT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `Email_2` (`Email`),
  UNIQUE KEY `Email_3` (`Email`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`UserID`, `FullName`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'Nguyen Van A', 'a@example.com', 'hashed_password_123', 'user', '2025-09-08 18:27:39', '0000-00-00 00:00:00'),
(2, 'Tran Thi B', 'b@example.com', 'hashed_password_456', 'admin', '2025-09-08 18:27:39', '0000-00-00 00:00:00'),
(8, 'Bui Thanh Hậu', 'hau69710@gmail.com', '$2a$12$RWYjYa/d9fDD/WWMi/El8ug9VAOLyS.5ajJa5mUQT.2C.ndp8zPI.', 'user', '2025-09-30 12:53:56', '2025-09-30 12:53:56'),
(7, 'Khánh Linh', 'khanhlinh@email.com', '$2a$12$YQQheUbZZwQyg/ie.5rZG.P7jlOyrsHC8TeZPF.rCqygRigk96LWC', 'user', '2025-09-13 18:41:26', '2025-09-13 18:41:26'),
(9, 'test', 'test@gmail.com', '$2a$12$LmdJyye/sUDZfPdiWH5HVuPSI/f9KRqrLygBao7PG1ZLO5owhPWzq', 'user', '2026-04-02 14:01:07', '2026-04-02 14:01:07');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallets`
--

DROP TABLE IF EXISTS `wallets`;
CREATE TABLE IF NOT EXISTS `wallets` (
  `WalletID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `WalletName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `InitialBalance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `CurrentBalance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `Month` int NOT NULL,
  `Year` int NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `WalletType` enum('budget','investment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'budget',
  PRIMARY KEY (`WalletID`),
  UNIQUE KEY `unique_wallet_per_month` (`UserID`,`WalletName`,`Month`,`Year`),
  KEY `UserID` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `wallets`
--

INSERT INTO `wallets` (`WalletID`, `UserID`, `WalletName`, `InitialBalance`, `CurrentBalance`, `Month`, `Year`, `CreatedAt`, `UpdatedAt`, `WalletType`) VALUES
(1, 3, 'Ví tiền của Hậu', 1000000.00, 1500000.00, 9, 2025, '2025-09-14 14:25:57', '2025-09-14 15:03:51', 'budget'),
(4, 3, 'Ví tiền của Hậu2', 0.00, 10000000.00, 9, 2025, '2025-09-14 14:41:31', '2025-09-14 15:54:42', 'budget'),
(6, 3, 'Ví để đầu tư', 100000.00, 8799900.00, 9, 2025, '2025-09-14 15:21:30', '2025-09-30 12:48:02', 'investment'),
(8, 8, 'NS1', 2000000.00, 2000000.00, 9, 2025, '2025-09-30 12:54:32', '2025-09-30 12:54:32', 'budget'),
(9, 8, 'NS2', 3000000.00, 3000000.00, 9, 2025, '2025-09-30 12:54:49', '2025-09-30 12:54:49', 'budget'),
(10, 8, 'VDT', 200000.00, 200000.00, 9, 2025, '2025-09-30 12:55:29', '2025-09-30 12:55:29', 'investment'),
(11, 8, 'Ví 1', 1000000.00, 800000.00, 10, 2025, '2025-10-02 23:33:47', '2025-10-02 23:52:43', 'investment'),
(12, 8, 'Ngân sách ví ', 1000000.00, 700000.00, 10, 2025, '2025-10-02 23:37:25', '2026-01-16 14:49:44', 'budget'),
(13, 8, 'Ví tiền của Hậu', 0.00, 300000.00, 10, 2025, '2025-10-05 10:36:15', '2026-01-16 14:49:46', 'budget'),
(14, 8, 'Ví tiền của Hậu', 1000000.00, 1000000.00, 11, 2025, '2025-11-11 12:58:21', '2026-01-16 14:49:38', 'budget'),
(15, 8, 'test', 1000000.00, 1000000.00, 12, 2025, '2025-12-07 19:02:50', '2026-01-16 14:49:13', 'budget'),
(16, 8, 'Ví tiền của Hậu2', 1000000.00, 1000000.00, 10, 2025, '2026-01-16 12:17:51', '2026-01-16 12:17:51', 'budget'),
(18, 8, 'Ví tiền của Hậu', 1000000.00, 1100000.00, 1, 2026, '2026-01-16 12:18:19', '2026-01-16 15:08:39', 'budget'),
(19, 8, 'tesst', 2000000.00, 2000000.00, 9, 2025, '2026-01-16 12:36:07', '2026-01-16 12:36:07', 'budget'),
(20, 8, 'bbb', 2000000.00, 1799900.00, 1, 2026, '2026-01-16 12:50:06', '2026-01-20 12:40:43', 'budget'),
(21, 9, 'Vi 1', 1000000.00, 1000000.00, 4, 2026, '2026-04-02 14:02:29', '2026-04-02 14:02:29', 'budget');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
