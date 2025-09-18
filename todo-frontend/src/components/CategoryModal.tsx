import React, { useState } from 'react';
import { CreateCategoryRequest } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: CreateCategoryRequest) => void;
  isLoading?: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    color?: string;
  }>({});

  // Predefined color options
  const colorOptions = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#F59E0B', name: 'Yellow' },
    { value: '#EF4444', name: 'Red' },
    { value: '#8B5CF6', name: 'Purple' },
    { value: '#F97316', name: 'Orange' },
    { value: '#06B6D4', name: 'Cyan' },
    { value: '#84CC16', name: 'Lime' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#6B7280', name: 'Gray' }
  ];

  const validateForm = (): boolean => {
    const errors: { name?: string; color?: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Category name must be less than 100 characters';
    }

    // Color validation
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(formData.color)) {
      errors.color = 'Please select a valid color';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      color: formData.color
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Category</h3>
            <span className="text-xs text-gray-500">* Required fields</span>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                className={`w-full rounded-md shadow-sm focus:ring-primary-500 ${
                  formErrors.name 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  // Clear error when user starts typing
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                }}
                placeholder="Enter category name"
                maxLength={100}
                disabled={isLoading}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description (optional)"
                maxLength={500}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional description to help identify this category
              </p>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Color *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, color: option.value });
                      if (formErrors.color) {
                        setFormErrors({ ...formErrors, color: undefined });
                      }
                    }}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === option.value 
                        ? 'border-gray-800 ring-2 ring-gray-300' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.name}
                  >
                    {formData.color === option.value && (
                      <span className="text-white text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom color input */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Or enter a custom hex color:
                </label>
                <input
                  type="text"
                  className={`w-full text-sm rounded-md shadow-sm focus:ring-primary-500 ${
                    formErrors.color 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                  value={formData.color}
                  onChange={(e) => {
                    setFormData({ ...formData, color: e.target.value });
                    if (formErrors.color) {
                      setFormErrors({ ...formErrors, color: undefined });
                    }
                  }}
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                  disabled={isLoading}
                />
              </div>
              
              {formErrors.color && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {formErrors.color}
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="flex items-center space-x-2">
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.name || 'Category Name'}
                </span>
                <span className="text-sm text-gray-500">
                  This is how your category will appear
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
                  !formData.name.trim()
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
