using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TodoController : ControllerBase
{
    private readonly ITodoService _todoService;
    private readonly ILogger<TodoController> _logger;
    
    public TodoController(ITodoService todoService, ILogger<TodoController> logger)
    {
        _todoService = todoService;
        _logger = logger;
    }
    
    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? throw new UnauthorizedAccessException("User ID not found in token");
    }
    
    /// <summary>
    /// Get paginated list of todo items with filtering and sorting
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<TodoItemResponseDto>>> GetTodoItems([FromQuery] TodoItemQueryDto query)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.GetTodoItemsAsync(userId, query);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving todo items");
            return StatusCode(500, new { message = "An error occurred while retrieving todo items" });
        }
    }
    
    /// <summary>
    /// Get a specific todo item by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TodoItemResponseDto>> GetTodoItem(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.GetTodoItemByIdAsync(id, userId);
            
            if (result == null)
                return NotFound(new { message = "Todo item not found" });
            
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving todo item {TodoId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the todo item" });
        }
    }
    
    /// <summary>
    /// Create a new todo item
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TodoItemResponseDto>> CreateTodoItem([FromBody] CreateTodoItemDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.CreateTodoItemAsync(dto, userId);
            
            return CreatedAtAction(nameof(GetTodoItem), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating todo item");
            return StatusCode(500, new { message = "An error occurred while creating the todo item" });
        }
    }
    
    /// <summary>
    /// Update an existing todo item
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TodoItemResponseDto>> UpdateTodoItem(int id, [FromBody] UpdateTodoItemDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.UpdateTodoItemAsync(id, dto, userId);
            
            if (result == null)
                return NotFound(new { message = "Todo item not found" });
            
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating todo item {TodoId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the todo item" });
        }
    }
    
    /// <summary>
    /// Delete a todo item
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTodoItem(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.DeleteTodoItemAsync(id, userId);
            
            if (!result)
                return NotFound(new { message = "Todo item not found" });
            
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting todo item {TodoId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the todo item" });
        }
    }
    
    /// <summary>
    /// Toggle completion status of a todo item
    /// </summary>
    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> ToggleCompletion(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _todoService.ToggleCompletionAsync(id, userId);
            
            if (!result)
                return NotFound(new { message = "Todo item not found" });
            
            return Ok(new { message = "Todo item completion status toggled successfully" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling completion for todo item {TodoId}", id);
            return StatusCode(500, new { message = "An error occurred while toggling the todo item" });
        }
    }
    
    /// <summary>
    /// Get todo item statistics for the current user
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetTodoStats()
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var totalCount = await _todoService.GetTodoItemsCountAsync(userId);
            var completedCount = await _todoService.GetCompletedTodoItemsCountAsync(userId);
            var overdueCount = await _todoService.GetOverdueTodoItemsCountAsync(userId);
            var pendingCount = totalCount - completedCount;
            
            return Ok(new
            {
                total = totalCount,
                completed = completedCount,
                pending = pendingCount,
                overdue = overdueCount,
                completionRate = totalCount > 0 ? Math.Round((double)completedCount / totalCount * 100, 1) : 0
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving todo statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
        }
    }
}
