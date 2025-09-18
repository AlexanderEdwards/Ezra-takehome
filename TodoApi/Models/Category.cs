using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models;

public class Category
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(7)]
    public string Color { get; set; } = "#3B82F6"; // Default blue color
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Foreign key
    public string UserId { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<TodoItem> TodoItems { get; set; } = new List<TodoItem>();
}
