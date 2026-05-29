import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Adjust as needed

interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  transactions?: T[];
  categories?: T[];
  goals?: T[];
  stats?: T;
  pagination?: any;
  reply?: string;
  provider?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add token to header if available
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = 'Có lỗi xảy ra';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Có lỗi xảy ra khi kết nối đến server');
    }
  }

  // Authentication APIs
  async register(userData: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/users/profile');
  }

  async updateProfile(userData: {
    fullName: string;
    email: string;
  }): Promise<ApiResponse> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Wallet APIs
  async getWallets(params?: { month?: number; year?: number }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallets?${queryString}` : '/wallets';
    return this.request(endpoint);
  }

  async getInvestmentWallets(params?: { month?: number; year?: number }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallets/investment?${queryString}` : '/wallets/investment';
    return this.request(endpoint);
  }

  async getWalletById(walletId: number): Promise<ApiResponse> {
    return this.request(`/wallets/${walletId}`);
  }

  async createWallet(walletData: any): Promise<ApiResponse> {
    return this.request('/wallets', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
  }

  async updateWallet(walletId: number, walletData: any): Promise<ApiResponse> {
    return this.request(`/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify(walletData),
    });
  }

  async deleteWallet(walletId: number): Promise<ApiResponse> {
    return this.request(`/wallets/${walletId}`, {
      method: 'DELETE',
    });
  }

  async getWalletStats(params?: { month?: number; year?: number }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallets/stats?${queryString}` : '/wallets/stats';
    return this.request(endpoint);
  }

  async transferBetweenWallets(transferData: {
    fromWalletId: number;
    toWalletId: number;
    amount: number;
    note?: string;
  }): Promise<ApiResponse> {
    return this.request('/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async getTransactionsByWallet(walletId: number, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions/wallet/${walletId}?${queryString}` : `/transactions/wallet/${walletId}`;
    return this.request(endpoint);
  }

  // Transaction APIs
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    categoryId?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    return this.request(endpoint);
  }

  async createTransaction(transactionData: {
    parentCategoryId?: number | null;
    childCategoryId?: number | null;
    walletId: number;
    amount: number;
    transactionDate: string;
    note?: string;
  }): Promise<ApiResponse> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(transactionId: number, transactionData: {
    parentCategoryId?: number | null;
    childCategoryId?: number | null;
    amount?: number;
    transactionDate?: string;
    note?: string;
  }): Promise<ApiResponse> {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(transactionId: number): Promise<ApiResponse> {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // Category APIs
  async getCategories(): Promise<ApiResponse> {
    return this.request('/categories');
  }

  async getParentCategories(type?: 'income' | 'expense'): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.append('type', type);
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/categories/parents?${queryString}` : '/categories/parents';
    return this.request(endpoint);
  }

  async getChildCategories(parentCategoryId?: number): Promise<ApiResponse> {
    if (parentCategoryId) {
      return this.request(`/categories/children/${parentCategoryId}`);
    } else {
      return this.request('/categories/children');
    }
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<ApiResponse> {
    return this.request(`/categories?type=${type}`);
  }

  async createCategory(categoryData: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    parentCategoryId?: number | null;
  }): Promise<ApiResponse> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(categoryId: number, categoryData: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
  }): Promise<ApiResponse> {
    return this.request(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: number): Promise<ApiResponse> {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Goal APIs
  async getGoals(params?: {
    status?: 'active' | 'completed' | 'overdue';
    sortBy?: 'deadline' | 'title' | 'targetAmount' | 'currentAmount';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/goals?${queryString}` : '/goals';
    return this.request(endpoint);
  }

  async createGoal(goalData: {
    title: string;
    targetAmount: number;
    deadline: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(goalId: number, goalData: {
    title?: string;
    targetAmount?: number;
    deadline?: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  }

  async deleteGoal(goalId: number): Promise<ApiResponse> {
    return this.request(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  }

  async depositToGoal(goalId: number, amount: number, walletId: number): Promise<ApiResponse> {
    return this.request(`/goals/${goalId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount, walletId }),
    });
  }

  async spendFromGoal(goalId: number, amount: number, categoryId: number, note: string): Promise<ApiResponse> {
    return this.request(`/goals/${goalId}/spend`, {
      method: 'POST',
      body: JSON.stringify({ amount, categoryId, note }),
    });
  }

  async getGoalStats(): Promise<ApiResponse> {
    return this.request('/goals/stats');
  }

  // Budget APIs
  async getBudgets(params?: {
    month?: number;
    year?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/budgets?${queryString}` : '/budgets';
    return this.request(endpoint);
  }

  async createBudget(budgetData: {
    parentCategoryId?: number | null;
    childCategoryId?: number | null;
    amount: number;
    month: number;
    year: number;
  }): Promise<ApiResponse> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(budgetId: number, budgetData: {
    parentCategoryId?: number | null;
    childCategoryId?: number | null;
    amount: number;
    month: number;
    year: number;
  }): Promise<ApiResponse> {
    return this.request(`/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(budgetId: number): Promise<ApiResponse> {
    return this.request(`/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  }

  async getBudgetProgress(params?: {
    month?: number;
    year?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/budgets/progress?${queryString}` : '/budgets/progress';
    return this.request(endpoint);
  }

  // Loan APIs
  async getLoans(params?: {
    type?: 'borrow' | 'lend';
    status?: 'active' | 'completed' | 'overdue';
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/loans?${queryString}` : '/loans';
    return this.request(endpoint);
  }

  async createLoan(loanData: {
    walletId: number;
    type: 'borrow' | 'lend';
    title: string;
    description?: string;
    principalAmount: number;
    interestRate?: number;
    startDate: string;
    dueDate?: string;
    borrowerName?: string;
    lenderName?: string;
  }): Promise<ApiResponse> {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  async updateLoan(loanId: number, loanData: {
    title?: string;
    description?: string;
    interestRate?: number;
    dueDate?: string;
    borrowerName?: string;
    lenderName?: string;
  }): Promise<ApiResponse> {
    return this.request(`/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(loanData),
    });
  }

  async deleteLoan(loanId: number): Promise<ApiResponse> {
    return this.request(`/loans/${loanId}`, {
      method: 'DELETE',
    });
  }

  async makeLoanPayment(loanId: number, paymentData: {
    amount: number;
    note?: string;
    transactionDate?: string;
  }): Promise<ApiResponse> {
    return this.request(`/loans/${loanId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getLoanTransactions(loanId: number): Promise<ApiResponse> {
    return this.request(`/loans/${loanId}/transactions`);
  }

  async getLoanStats(): Promise<ApiResponse> {
    return this.request('/loans/stats');
  }

  // Report APIs
  async getOverviewReport(startDate?: string, endDate?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/overview?${queryString}` : '/reports/overview';
    return this.request(endpoint);
  }

  async getExpenseByCategoryReport(startDate?: string, endDate?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/expense-by-category?${queryString}` : '/reports/expense-by-category';
    return this.request(endpoint);
  }

  async getIncomeByCategoryReport(startDate?: string, endDate?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/income-by-category?${queryString}` : '/reports/income-by-category';
    return this.request(endpoint);
  }

  async getMonthlyReport(year?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/monthly?${queryString}` : '/reports/monthly';
    return this.request(endpoint);
  }

  async getWalletReport(): Promise<ApiResponse> {
    return this.request('/reports/wallets');
  }

  // AI Chat APIs
  async chatWithAI(message: string, history: { role: string; content: string }[] = []): Promise<ApiResponse> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Token management
export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem('token', token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('token');
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem('token');
};
 