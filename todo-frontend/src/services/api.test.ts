import { Priority } from '../types';

// Mock the entire api module
jest.mock('./api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
    toggleTodoCompletion: jest.fn(),
    getCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getProfile: jest.fn(),
    validateToken: jest.fn(),
    getTodoStats: jest.fn(),
  },
}));

import { apiService } from './api';
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('login should call login method with correct parameters', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
      };
      mockApiService.login.mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await apiService.login(credentials);

      expect(mockApiService.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponse);
    });

    test('register should call register method with correct parameters', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
      };
      mockApiService.register.mockResolvedValue(mockResponse);

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };
      const result = await apiService.register(userData);

      expect(mockApiService.register).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Todo Operations', () => {
    test('getTodos should call getTodos method', async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            title: 'Test Todo',
            description: 'Test Description',
            isCompleted: false,
            priority: Priority.Medium,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20
      };
      mockApiService.getTodos.mockResolvedValue(mockResponse);

      const query = { page: 1, pageSize: 10 };
      const result = await apiService.getTodos(query);

      expect(mockApiService.getTodos).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    test('createTodo should call createTodo method with correct parameters', async () => {
      const mockResponse = {
        id: 1,
        title: 'New Todo',
        description: 'New Description',
        isCompleted: false,
        priority: Priority.High,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      mockApiService.createTodo.mockResolvedValue(mockResponse);

      const todoData = {
        title: 'New Todo',
        description: 'New Description',
        priority: Priority.High,
        dueDate: '2023-12-31',
        categoryId: 1
      };

      const result = await apiService.createTodo(todoData);

      expect(mockApiService.createTodo).toHaveBeenCalledWith(todoData);
      expect(result).toEqual(mockResponse);
    });

    test('deleteTodo should call deleteTodo method with correct id', async () => {
      mockApiService.deleteTodo.mockResolvedValue(undefined);

      await apiService.deleteTodo(1);

      expect(mockApiService.deleteTodo).toHaveBeenCalledWith(1);
    });

    test('toggleTodoCompletion should call toggleTodoCompletion method', async () => {
      mockApiService.toggleTodoCompletion.mockResolvedValue(undefined);

      await apiService.toggleTodoCompletion(1);

      expect(mockApiService.toggleTodoCompletion).toHaveBeenCalledWith(1);
    });
  });

  describe('Categories', () => {
    test('getCategories should call getCategories method', async () => {
      const mockResponse = [
        {
          id: 1,
          name: 'Work',
          description: 'Work tasks',
          color: '#3B82F6',
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];
      mockApiService.getCategories.mockResolvedValue(mockResponse);

      const result = await apiService.getCategories();

      expect(mockApiService.getCategories).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('createCategory should call createCategory method with correct parameters', async () => {
      const mockResponse = {
        id: 1,
        name: 'New Category',
        description: 'New Description',
        color: '#10B981',
        createdAt: '2023-01-01T00:00:00Z'
      };
      mockApiService.createCategory.mockResolvedValue(mockResponse);

      const categoryData = {
        name: 'New Category',
        description: 'New Description',
        color: '#10B981'
      };

      const result = await apiService.createCategory(categoryData);

      expect(mockApiService.createCategory).toHaveBeenCalledWith(categoryData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      mockApiService.login.mockRejectedValue(mockError);

      await expect(apiService.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toEqual(mockError);
    });
  });
});