import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { TodoItem, CreateTodoRequest, UpdateTodoRequest, Category, TodoQuery, Priority } from '../types';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const TodoDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // State for modal and forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [newTodo, setNewTodo] = useState<CreateTodoRequest>({
    title: '',
    description: '',
    priority: Priority.Medium,
    dueDate: '',
    categoryId: undefined
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    dueDate?: string;
  }>({});

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters (memoized to prevent unnecessary re-renders)
  const queryParams: TodoQuery = useMemo(() => ({
    search: debouncedSearchTerm || undefined,
    categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
    priority: priorityFilter ? Priority[priorityFilter as keyof typeof Priority] : undefined,
    isCompleted: statusFilter === 'completed' ? true : statusFilter === 'pending' ? false : undefined,
    sortBy: sortBy,
    sortDescending: sortOrder === 'desc',
    page: 1,
    pageSize: 50
  }), [debouncedSearchTerm, selectedCategory, priorityFilter, statusFilter, sortBy, sortOrder]);

  // Queries
  const { data: todosData, isLoading: todosLoading, error: todosError, isFetching } = useQuery({
    queryKey: ['todos', queryParams],
    queryFn: () => apiService.getTodos(queryParams),
    staleTime: 1000, // Consider data fresh for 1 second
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data to prevent flickering
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories()
  });

  const { data: stats } = useQuery({
    queryKey: ['todo-stats'],
    queryFn: () => apiService.getTodoStats()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (todo: CreateTodoRequest) => {
      console.log('Mutation function called with:', todo);
      return apiService.createTodo(todo);
    },
    onSuccess: (data) => {
      console.log('Todo created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
      closeCreateModal();
      toast.success('Todo created successfully!');
    },
    onError: (error: any) => {
      console.error('Create todo error:', error);
      toast.error(error.response?.data?.message || 'Failed to create todo');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTodoRequest }) => 
      apiService.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
      setEditingTodo(null);
      toast.success('Todo updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update todo');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiService.toggleTodoCompletion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle todo');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTodo(id),
    onSuccess: () => {
      console.log('Delete mutation successful');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
      toast.success('Todo deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete todo');
    }
  });

  // Form validation function
  const validateForm = (): boolean => {
    const errors: { title?: string; dueDate?: string } = {};

    // Title validation
    if (!newTodo.title.trim()) {
      errors.title = 'Title is required';
    } else if (newTodo.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (newTodo.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    // Due date validation
    if (!newTodo.dueDate || !newTodo.dueDate.trim()) {
      errors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(newTodo.dueDate);
      const now = new Date();
      // Set time to start of day for comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      if (selectedDay < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTodo = () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    console.log('Creating todo:', newTodo);
    createMutation.mutate(newTodo);
  };

  // Clear form and errors when modal closes
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewTodo({ title: '', description: '', priority: Priority.Medium, dueDate: '', categoryId: undefined });
    setFormErrors({});
  };

  const handleUpdateTodo = (todo: TodoItem, updates: Partial<UpdateTodoRequest>) => {
    updateMutation.mutate({
      id: todo.id,
      data: {
        title: updates.title ?? todo.title,
        description: updates.description ?? todo.description,
        isCompleted: updates.isCompleted ?? todo.isCompleted,
        priority: updates.priority ?? todo.priority,
        dueDate: updates.dueDate ?? todo.dueDate,
        categoryId: updates.categoryId ?? todo.categoryId
      }
    });
  };

  const handleToggleTodo = (todo: TodoItem) => {
    // Optimistic update
    queryClient.setQueryData(['todos', queryParams], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        items: oldData.items.map((item: TodoItem) =>
          item.id === todo.id ? { ...item, isCompleted: !item.isCompleted } : item
        )
      };
    });
    
    toggleMutation.mutate(todo.id);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'text-red-600 bg-red-50 border-red-200';
      case Priority.Medium: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case Priority.Low: return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryById = (id: number) => categories?.find((cat: Category) => cat.id === id);

  // Only show full loading spinner on initial load, not during searches
  if ((todosLoading && !todosData) || categoriesLoading) {
    return <LoadingSpinner />;
  }

  if (todosError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Todos</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const todos = (todosData as any)?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Todo Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your tasks efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                <p className="text-sm text-gray-600">{user.firstName} {user.lastName}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
            >
              <span>👋</span>
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  {isFetching && searchTerm ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🔍'
                  )}
                </span>
                <input
                  type="text"
                  placeholder="Search todos..."
                  className={`pl-10 pr-4 w-full rounded-md shadow-sm focus:ring-primary-500 transition-colors ${
                    isFetching && searchTerm 
                      ? 'border-blue-300 focus:border-blue-500' 
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories?.map((category: Category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="priority-desc">Priority High-Low</option>
                <option value="priority-asc">Priority Low-High</option>
                <option value="dueDate-asc">Due Date Soon</option>
                <option value="dueDate-desc">Due Date Later</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Todo Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            Add New Todo
          </button>
        </div>

        {/* Todos List */}
        <div className="space-y-4 relative">
          {/* Subtle loading overlay for search */}
          {isFetching && todosData && (
            <div className="absolute top-0 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-2 z-10">
              <div className="flex items-center justify-center text-sm text-blue-700">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            </div>
          )}
          
          {todos.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">
                {searchTerm || selectedCategory || priorityFilter || statusFilter ? '🔍' : '📝'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory || priorityFilter || statusFilter ? 'No matching todos found' : 'No todos found'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory || priorityFilter || statusFilter 
                  ? 'Try adjusting your search filters or create a new todo.'
                  : 'Get started by creating your first todo!'
                }
              </p>
            </div>
          ) : (
            todos.map((todo: TodoItem) => (
              <div key={todo.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <button
                      onClick={() => handleToggleTodo(todo)}
                      className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        todo.isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                      disabled={toggleMutation.isPending}
                    >
                      {todo.isCompleted && <span className="text-xs">✓</span>}
                    </button>

                    <div className="flex-1">
                      <h3 className={`text-lg font-medium ${
                        todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`mt-1 ${
                          todo.isCompleted ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mt-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                          {todo.priorityName}
                        </span>

                        {todo.categoryName && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: todo.categoryColor }}
                          >
                            {todo.categoryName}
                          </span>
                        )}

                        {todo.dueDate && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <span className="mr-1">📅</span>
                            {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingTodo(todo)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        console.log('Delete button clicked for todo ID:', todo.id);
                        deleteMutation.mutate(todo.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      disabled={deleteMutation.isPending}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Todo Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Todo</h3>
                  <span className="text-xs text-gray-500">* Required fields</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-md shadow-sm focus:ring-primary-500 ${
                        formErrors.title 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                      value={newTodo.title}
                      onChange={(e) => {
                        setNewTodo({ ...newTodo, title: e.target.value });
                        // Clear error when user starts typing
                        if (formErrors.title) {
                          setFormErrors({ ...formErrors, title: undefined });
                        }
                      }}
                      placeholder="Enter todo title"
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={newTodo.description}
                      onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                      placeholder="Enter description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={Priority[newTodo.priority]}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: Priority[e.target.value as keyof typeof Priority] })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={newTodo.categoryId || ''}
                      onChange={(e) => setNewTodo({ ...newTodo, categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">No Category</option>
                      {categories?.map((category: Category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      className={`w-full rounded-md shadow-sm focus:ring-primary-500 ${
                        formErrors.dueDate 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                      value={newTodo.dueDate}
                      onChange={(e) => {
                        setNewTodo({ ...newTodo, dueDate: e.target.value || '' });
                        // Clear error when user starts typing
                        if (formErrors.dueDate) {
                          setFormErrors({ ...formErrors, dueDate: undefined });
                        }
                      }}
                      min={new Date().toISOString().slice(0, 16)} // Prevent past dates in the picker
                    />
                    {formErrors.dueDate && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {formErrors.dueDate}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Select when this task should be completed
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeCreateModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTodo}
                    disabled={createMutation.isPending || !newTodo.title.trim() || !newTodo.dueDate || !newTodo.dueDate.trim()}
                    className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
                      !newTodo.title.trim() || !newTodo.dueDate || !newTodo.dueDate.trim()
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Todo'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Todo Modal */}
        {editingTodo && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Todo</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={editingTodo.title}
                      onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={editingTodo.description || ''}
                      onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={Priority[editingTodo.priority]}
                      onChange={(e) => setEditingTodo({ ...editingTodo, priority: Priority[e.target.value as keyof typeof Priority] })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={editingTodo.categoryId || ''}
                      onChange={(e) => setEditingTodo({ ...editingTodo, categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">No Category</option>
                      {categories?.map((category: Category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={editingTodo.dueDate ? new Date(editingTodo.dueDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingTodo(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateTodo(editingTodo, {
                      title: editingTodo.title,
                      description: editingTodo.description,
                      isCompleted: editingTodo.isCompleted,
                      priority: editingTodo.priority,
                      categoryId: editingTodo.categoryId,
                      dueDate: editingTodo.dueDate
                    })}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Todo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoDashboard;