using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public class TodoService : ITodoService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TodoService> _logger;
    
    public TodoService(ApplicationDbContext context, ILogger<TodoService> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    public async Task<PaginatedResponse<TodoItemResponseDto>> GetTodoItemsAsync(string userId, TodoItemQueryDto query)
    {
        var queryable = _context.TodoItems
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);
        
        // Apply filters
        if (query.IsCompleted.HasValue)
            queryable = queryable.Where(t => t.IsCompleted == query.IsCompleted.Value);
            
        if (query.Priority.HasValue)
            queryable = queryable.Where(t => t.Priority == query.Priority.Value);
            
        if (query.CategoryId.HasValue)
            queryable = queryable.Where(t => t.CategoryId == query.CategoryId.Value);
            
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchTerm = query.Search.ToLower();
            queryable = queryable.Where(t => 
                t.Title.ToLower().Contains(searchTerm) ||
                (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
        }
        
        if (query.DueBefore.HasValue)
            queryable = queryable.Where(t => t.DueDate <= query.DueBefore.Value);
            
        if (query.DueAfter.HasValue)
            queryable = queryable.Where(t => t.DueDate >= query.DueAfter.Value);
        
        // Apply sorting
        queryable = query.SortBy.ToLower() switch
        {
            "title" => query.SortDescending ? queryable.OrderByDescending(t => t.Title) : queryable.OrderBy(t => t.Title),
            "priority" => query.SortDescending ? queryable.OrderByDescending(t => t.Priority) : queryable.OrderBy(t => t.Priority),
            "duedate" => query.SortDescending ? queryable.OrderByDescending(t => t.DueDate) : queryable.OrderBy(t => t.DueDate),
            "updatedat" => query.SortDescending ? queryable.OrderByDescending(t => t.UpdatedAt) : queryable.OrderBy(t => t.UpdatedAt),
            _ => query.SortDescending ? queryable.OrderByDescending(t => t.CreatedAt) : queryable.OrderBy(t => t.CreatedAt)
        };
        
        var totalCount = await queryable.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize);
        
        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => new TodoItemResponseDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                Priority = t.Priority,
                PriorityName = t.Priority.ToString(),
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CompletedAt = t.CompletedAt,
                IsOverdue = t.DueDate.HasValue && t.DueDate < DateTime.UtcNow && !t.IsCompleted,
                DaysUntilDue = t.DueDate.HasValue ? (int)(t.DueDate.Value - DateTime.UtcNow).TotalDays : 0,
                CategoryId = t.CategoryId,
                CategoryName = t.Category != null ? t.Category.Name : null,
                CategoryColor = t.Category != null ? t.Category.Color : null
            })
            .ToListAsync();
        
        return new PaginatedResponse<TodoItemResponseDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = query.Page > 1,
            HasNextPage = query.Page < totalPages
        };
    }
    
    public async Task<TodoItemResponseDto?> GetTodoItemByIdAsync(int id, string userId)
    {
        var todoItem = await _context.TodoItems
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            
        if (todoItem == null)
            return null;
            
        return new TodoItemResponseDto
        {
            Id = todoItem.Id,
            Title = todoItem.Title,
            Description = todoItem.Description,
            IsCompleted = todoItem.IsCompleted,
            Priority = todoItem.Priority,
            PriorityName = todoItem.Priority.ToString(),
            DueDate = todoItem.DueDate,
            CreatedAt = todoItem.CreatedAt,
            UpdatedAt = todoItem.UpdatedAt,
            CompletedAt = todoItem.CompletedAt,
            IsOverdue = todoItem.IsOverdue,
            DaysUntilDue = todoItem.DaysUntilDue,
            CategoryId = todoItem.CategoryId,
            CategoryName = todoItem.Category?.Name,
            CategoryColor = todoItem.Category?.Color
        };
    }
    
    public async Task<TodoItemResponseDto> CreateTodoItemAsync(CreateTodoItemDto dto, string userId)
    {
        // Validate category belongs to user if specified
        if (dto.CategoryId.HasValue)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == dto.CategoryId.Value && c.UserId == userId);
            if (!categoryExists)
                throw new ArgumentException("Category not found or does not belong to user");
        }
        
        var todoItem = new TodoItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            CategoryId = dto.CategoryId,
            UserId = userId
        };
        
        _context.TodoItems.Add(todoItem);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Todo item created with ID {TodoId} for user {UserId}", todoItem.Id, userId);
        
        // Fetch the created item with category information
        return await GetTodoItemByIdAsync(todoItem.Id, userId) 
               ?? throw new InvalidOperationException("Failed to retrieve created todo item");
    }
    
    public async Task<TodoItemResponseDto?> UpdateTodoItemAsync(int id, UpdateTodoItemDto dto, string userId)
    {
        var todoItem = await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (todoItem == null)
            return null;
        
        // Validate category belongs to user if specified
        if (dto.CategoryId.HasValue)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == dto.CategoryId.Value && c.UserId == userId);
            if (!categoryExists)
                throw new ArgumentException("Category not found or does not belong to user");
        }
        
        todoItem.Title = dto.Title;
        todoItem.Description = dto.Description;
        todoItem.IsCompleted = dto.IsCompleted;
        todoItem.Priority = dto.Priority;
        todoItem.DueDate = dto.DueDate;
        todoItem.CategoryId = dto.CategoryId;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Todo item {TodoId} updated for user {UserId}", id, userId);
        
        return await GetTodoItemByIdAsync(id, userId);
    }
    
    public async Task<bool> DeleteTodoItemAsync(int id, string userId)
    {
        var todoItem = await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (todoItem == null)
            return false;
        
        _context.TodoItems.Remove(todoItem);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Todo item {TodoId} deleted for user {UserId}", id, userId);
        
        return true;
    }
    
    public async Task<bool> ToggleCompletionAsync(int id, string userId)
    {
        var todoItem = await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (todoItem == null)
            return false;
        
        todoItem.IsCompleted = !todoItem.IsCompleted;
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Todo item {TodoId} completion toggled to {IsCompleted} for user {UserId}", 
            id, todoItem.IsCompleted, userId);
        
        return true;
    }
    
    public async Task<int> GetTodoItemsCountAsync(string userId)
    {
        return await _context.TodoItems.CountAsync(t => t.UserId == userId);
    }
    
    public async Task<int> GetCompletedTodoItemsCountAsync(string userId)
    {
        return await _context.TodoItems.CountAsync(t => t.UserId == userId && t.IsCompleted);
    }
    
    public async Task<int> GetOverdueTodoItemsCountAsync(string userId)
    {
        var now = DateTime.UtcNow;
        return await _context.TodoItems.CountAsync(t => 
            t.UserId == userId && 
            !t.IsCompleted && 
            t.DueDate.HasValue && 
            t.DueDate < now);
    }
}
