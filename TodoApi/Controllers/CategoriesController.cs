using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoriesController> _logger;
    
    public CategoriesController(ApplicationDbContext context, ILogger<CategoriesController> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? throw new UnauthorizedAccessException("User ID not found in token");
    }
    
    /// <summary>
    /// Get all categories for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Color = c.Color,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    TodoItemsCount = c.TodoItems.Count
                })
                .OrderBy(c => c.Name)
                .ToListAsync();
            
            return Ok(categories);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new { message = "An error occurred while retrieving categories" });
        }
    }
    
    /// <summary>
    /// Get a specific category by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryResponseDto>> GetCategory(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var category = await _context.Categories
                .Where(c => c.Id == id && c.UserId == userId)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Color = c.Color,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    TodoItemsCount = c.TodoItems.Count
                })
                .FirstOrDefaultAsync();
            
            if (category == null)
                return NotFound(new { message = "Category not found" });
            
            return Ok(category);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the category" });
        }
    }
    
    /// <summary>
    /// Create a new category
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CategoryResponseDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        
        try
        {
            var userId = GetCurrentUserId();
            
            // Check if category with same name already exists for this user
            var existingCategory = await _context.Categories
                .AnyAsync(c => c.UserId == userId && c.Name.ToLower() == dto.Name.ToLower());
            
            if (existingCategory)
            {
                return BadRequest(new { message = "A category with this name already exists" });
            }
            
            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                Color = dto.Color,
                UserId = userId
            };
            
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Category created with ID {CategoryId} for user {UserId}", category.Id, userId);
            
            var result = new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt,
                TodoItemsCount = 0
            };
            
            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new { message = "An error occurred while creating the category" });
        }
    }
    
    /// <summary>
    /// Update an existing category
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryResponseDto>> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        
        try
        {
            var userId = GetCurrentUserId();
            
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            
            if (category == null)
                return NotFound(new { message = "Category not found" });
            
            // Check if another category with same name already exists for this user
            var existingCategory = await _context.Categories
                .AnyAsync(c => c.UserId == userId && c.Id != id && c.Name.ToLower() == dto.Name.ToLower());
            
            if (existingCategory)
            {
                return BadRequest(new { message = "A category with this name already exists" });
            }
            
            category.Name = dto.Name;
            category.Description = dto.Description;
            category.Color = dto.Color;
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Category {CategoryId} updated for user {UserId}", id, userId);
            
            var result = new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt,
                TodoItemsCount = await _context.TodoItems.CountAsync(t => t.CategoryId == category.Id)
            };
            
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the category" });
        }
    }
    
    /// <summary>
    /// Delete a category
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            
            if (category == null)
                return NotFound(new { message = "Category not found" });
            
            // Check if category has associated todo items
            var hasAssociatedTodos = await _context.TodoItems.AnyAsync(t => t.CategoryId == id);
            if (hasAssociatedTodos)
            {
                return BadRequest(new { message = "Cannot delete category that has associated todo items. Please move or delete the todo items first." });
            }
            
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Category {CategoryId} deleted for user {UserId}", id, userId);
            
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {CategoryId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the category" });
        }
    }
}
