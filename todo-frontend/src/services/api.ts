import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoQuery,
  PaginatedResponse,
  TodoStats,
} from '../types';

// Production-ready HTTPS configuration with HTTP fallback testing
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.REACT_APP_USE_HTTP === 'true' ? 'http://localhost:5001/api' : 'https://localhost:7001/api');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/profile');
    return response.data;
  }

  async validateToken(): Promise<{ isValid: boolean; message: string }> {
    const response = await this.api.post('/auth/validate-token');
    return response.data;
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.api.get('/categories');
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: CreateCategoryRequest): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.post('/categories', category);
    return response.data;
  }

  async updateCategory(id: number, category: UpdateCategoryRequest): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.put(`/categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Todos endpoints
  async getTodos(query?: TodoQuery): Promise<PaginatedResponse<TodoItem>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<PaginatedResponse<TodoItem>> = await this.api.get(
      `/todo?${params.toString()}`
    );
    return response.data;
  }

  async getTodo(id: number): Promise<TodoItem> {
    const response: AxiosResponse<TodoItem> = await this.api.get(`/todo/${id}`);
    return response.data;
  }

  async createTodo(todo: CreateTodoRequest): Promise<TodoItem> {
    console.log('API createTodo called with:', todo);
    console.log('Auth token:', localStorage.getItem('authToken'));
    const response: AxiosResponse<TodoItem> = await this.api.post('/todo', todo);
    console.log('API response:', response);
    return response.data;
  }

  async updateTodo(id: number, todo: UpdateTodoRequest): Promise<TodoItem> {
    const response: AxiosResponse<TodoItem> = await this.api.put(`/todo/${id}`, todo);
    return response.data;
  }

  async deleteTodo(id: number): Promise<void> {
    console.log('API deleteTodo called with ID:', id);
    console.log('Auth token:', localStorage.getItem('authToken'));
    console.log('API Base URL:', API_BASE_URL);
    try {
      const response = await this.api.delete(`/todo/${id}`);
      console.log('Delete API response:', response);
      return response.data;
    } catch (error) {
      console.error('Delete API error:', error);
      throw error;
    }
  }

  async toggleTodoCompletion(id: number): Promise<void> {
    await this.api.patch(`/todo/${id}/toggle`);
  }

  async getTodoStats(): Promise<TodoStats> {
    const response: AxiosResponse<TodoStats> = await this.api.get('/todo/stats');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
