export enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  todoItemsCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  color: string;
}

export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: Priority;
  priorityName: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isOverdue: boolean;
  daysUntilDue: number;
  categoryId?: number;
  categoryName?: string;
  categoryColor?: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  categoryId?: number;
}

export interface UpdateTodoRequest {
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: Priority;
  dueDate?: string;
  categoryId?: number;
}

export interface TodoQuery {
  isCompleted?: boolean;
  priority?: Priority;
  categoryId?: number;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
