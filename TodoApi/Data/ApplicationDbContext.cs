using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace TodoApi.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<TodoItem> TodoItems { get; set; }
    public DbSet<Category> Categories { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure TodoItem entity
        modelBuilder.Entity<TodoItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Priority).HasConversion<int>();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
            
            // Configure relationships
            entity.HasOne(e => e.User)
                  .WithMany(u => u.TodoItems)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.TodoItems)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            // Create indexes for better performance
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.IsCompleted);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => e.CreatedAt);
        });
        
        // Configure Category entity
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
            
            // Configure relationships
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Categories)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            // Create indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
        });
        
        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });
    }
    
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }
    
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }
    
    private void UpdateTimestamps()
    {
        var entities = ChangeTracker.Entries()
            .Where(x => x.Entity is TodoItem || x.Entity is Category || x.Entity is User)
            .Where(x => x.State == EntityState.Added || x.State == EntityState.Modified);
            
        foreach (var entity in entities)
        {
            if (entity.State == EntityState.Added)
            {
                if (entity.Entity is TodoItem todoItem)
                {
                    todoItem.CreatedAt = DateTime.UtcNow;
                    todoItem.UpdatedAt = DateTime.UtcNow;
                }
                else if (entity.Entity is Category category)
                {
                    category.CreatedAt = DateTime.UtcNow;
                    category.UpdatedAt = DateTime.UtcNow;
                }
                else if (entity.Entity is User user)
                {
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }
            else if (entity.State == EntityState.Modified)
            {
                if (entity.Entity is TodoItem todoItem)
                {
                    todoItem.UpdatedAt = DateTime.UtcNow;
                    if (todoItem.IsCompleted && todoItem.CompletedAt == null)
                    {
                        todoItem.CompletedAt = DateTime.UtcNow;
                    }
                    else if (!todoItem.IsCompleted && todoItem.CompletedAt != null)
                    {
                        todoItem.CompletedAt = null;
                    }
                }
                else if (entity.Entity is Category category)
                {
                    category.UpdatedAt = DateTime.UtcNow;
                }
                else if (entity.Entity is User user)
                {
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
