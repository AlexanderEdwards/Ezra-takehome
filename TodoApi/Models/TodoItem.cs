using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models;

public class TodoItem
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public bool IsCompleted { get; set; } = false;
    
    public Priority Priority { get; set; } = Priority.Medium;
    
    public DateTime? DueDate { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    // Foreign keys
    public string UserId { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Category? Category { get; set; }
    
    // Helper methods
    public bool IsOverdue => DueDate.HasValue && DueDate < DateTime.UtcNow && !IsCompleted;
    public int DaysUntilDue => DueDate.HasValue ? (int)(DueDate.Value - DateTime.UtcNow).TotalDays : 0;
}

public enum Priority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
