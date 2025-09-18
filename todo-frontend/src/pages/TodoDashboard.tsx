import React, { useState, useEffect } from 'react';
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

  // Build query parameters
  const queryParams: TodoQuery = {
    search: searchTerm || undefined,
    categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
    priority: priorityFilter ? Priority[priorityFilter as keyof typeof Priority] : undefined,
    isCompleted: statusFilter === 'completed' ? true : statusFilter === 'pending' ? false : undefined,
    sortBy: sortBy,
    sortDescending: sortOrder === 'desc',
    page: 1,
    pageSize: 50
  };

  // Queries
  const { data: todosData, isLoading: todosLoading, error: todosError } = useQuery({
    queryKey: ['todos', queryParams],
    queryFn: () => apiService.getTodos(queryParams)
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
      setIsCreateModalOpen(false);
      setNewTodo({ title: '', description: '', priority: Priority.Medium, dueDate: '', categoryId: undefined });
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

  const handleCreateTodo = () => {
    if (!newTodo.title.trim()) {
      toast.error('Title is required');
      return;
    }
    console.log('Creating todo:', newTodo);
    createMutation.mutate(newTodo);
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

  if (todosLoading || categoriesLoading) {
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

  const todos = todosData?.items || [];

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
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search todos..."
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
              <p className="text-gray-600">Get started by creating your first todo!</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Todo</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      placeholder="Enter todo title"
                    />
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
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTodo}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Todo'}
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