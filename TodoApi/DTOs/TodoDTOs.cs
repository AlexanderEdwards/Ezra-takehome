using System.ComponentModel.DataAnnotations;
using TodoApi.Models;

namespace TodoApi.DTOs;

public class CreateTodoItemDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public Priority Priority { get; set; } = Priority.Medium;
    
    public DateTime? DueDate { get; set; }
    
    public int? CategoryId { get; set; }
}

public class UpdateTodoItemDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public bool IsCompleted { get; set; }
    
    public Priority Priority { get; set; } = Priority.Medium;
    
    public DateTime? DueDate { get; set; }
    
    public int? CategoryId { get; set; }
}

public class TodoItemResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public Priority Priority { get; set; }
    public string PriorityName { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsOverdue { get; set; }
    public int DaysUntilDue { get; set; }
    
    // Category information
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryColor { get; set; }
}

public class TodoItemQueryDto
{
    public bool? IsCompleted { get; set; }
    public Priority? Priority { get; set; }
    public int? CategoryId { get; set; }
    public string? Search { get; set; }
    public DateTime? DueBefore { get; set; }
    public DateTime? DueAfter { get; set; }
    public string SortBy { get; set; } = "CreatedAt";
    public bool SortDescending { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PaginatedResponse<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}
