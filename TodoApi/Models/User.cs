using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models;

public class User : IdentityUser
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<TodoItem> TodoItems { get; set; } = new List<TodoItem>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    
    public string FullName => $"{FirstName} {LastName}";
}
