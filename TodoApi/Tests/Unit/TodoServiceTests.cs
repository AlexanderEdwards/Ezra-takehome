using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Unit;

public class TodoServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly TodoService _todoService;
    private readonly Mock<ILogger<TodoService>> _mockLogger;
    private readonly string _testUserId = "test-user-id";

    public TodoServiceTests()
    {
        // Create in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        
        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<TodoService>>();
        _todoService = new TodoService(_context, _mockLogger.Object);
        
        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var testCategory = new Category
        {
            Id = 1,
            Name = "Test Category",
            Description = "Test Description",
            Color = "#FF0000",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var testTodo = new TodoItem
        {
            Id = 1,
            Title = "Test Todo",
            Description = "Test Description",
            IsCompleted = false,
            Priority = Priority.Medium,
            DueDate = DateTime.UtcNow.AddDays(1),
            UserId = _testUserId,
            CategoryId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(testCategory);
        _context.TodoItems.Add(testTodo);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetTodoItemsAsync_ReturnsUserTodosOnly()
    {
        // Arrange
        var query = new TodoItemQueryDto { Page = 1, PageSize = 10 };

        // Act
        var result = await _todoService.GetTodoItemsAsync(_testUserId, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal("Test Todo", result.Items.First().Title);
    }

    [Fact]
    public async Task GetTodoItemsAsync_FiltersCompletedTodos()
    {
        // Arrange
        var completedTodo = new TodoItem
        {
            Title = "Completed Todo",
            Description = "Completed",
            IsCompleted = true,
            Priority = Priority.Low,
            UserId = _testUserId,
            CategoryId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.TodoItems.Add(completedTodo);
        await _context.SaveChangesAsync();

        var query = new TodoItemQueryDto { Page = 1, PageSize = 10, IsCompleted = true };

        // Act
        var result = await _todoService.GetTodoItemsAsync(_testUserId, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.True(result.Items.First().IsCompleted);
    }

    [Fact]
    public async Task GetTodoItemsAsync_FiltersByPriority()
    {
        // Arrange
        var highPriorityTodo = new TodoItem
        {
            Title = "High Priority Todo",
            Description = "High priority task",
            IsCompleted = false,
            Priority = Priority.High,
            UserId = _testUserId,
            CategoryId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.TodoItems.Add(highPriorityTodo);
        await _context.SaveChangesAsync();

        var query = new TodoItemQueryDto { Page = 1, PageSize = 10, Priority = Priority.High };

        // Act
        var result = await _todoService.GetTodoItemsAsync(_testUserId, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(Priority.High, result.Items.First().Priority);
    }

    [Fact]
    public async Task GetTodoItemsAsync_SearchesByTitle()
    {
        // Arrange
        var query = new TodoItemQueryDto { Page = 1, PageSize = 10, Search = "Test" };

        // Act
        var result = await _todoService.GetTodoItemsAsync(_testUserId, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Contains("Test", result.Items.First().Title);
    }

    [Fact]
    public async Task CreateTodoItemAsync_CreatesNewTodo()
    {
        // Arrange
        var createDto = new CreateTodoItemDto
        {
            Title = "New Todo",
            Description = "New Description",
            Priority = Priority.High,
            DueDate = DateTime.UtcNow.AddDays(2),
            CategoryId = 1
        };

        // Act
        var result = await _todoService.CreateTodoItemAsync(createDto, _testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Todo", result.Title);
        Assert.Equal("New Description", result.Description);
        Assert.Equal(Priority.High, result.Priority);

        // Verify it was saved to database
        var savedTodo = await _context.TodoItems.FindAsync(result.Id);
        Assert.NotNull(savedTodo);
        Assert.Equal("New Todo", savedTodo.Title);
    }

    [Fact]
    public async Task UpdateTodoItemAsync_UpdatesExistingTodo()
    {
        // Arrange
        var updateDto = new UpdateTodoItemDto
        {
            Title = "Updated Todo",
            Description = "Updated Description",
            Priority = Priority.Critical,
            IsCompleted = true
        };

        // Act
        var result = await _todoService.UpdateTodoItemAsync(1, updateDto, _testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Todo", result.Title);
        Assert.Equal("Updated Description", result.Description);
        Assert.Equal(Priority.Critical, result.Priority);
        Assert.True(result.IsCompleted);
        Assert.NotNull(result.CompletedAt);
    }

    [Fact]
    public async Task UpdateTodoItemAsync_ReturnsNullForNonExistentTodo()
    {
        // Arrange
        var updateDto = new UpdateTodoItemDto
        {
            Title = "Updated Todo",
            Description = "Updated Description"
        };

        // Act
        var result = await _todoService.UpdateTodoItemAsync(999, updateDto, _testUserId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteTodoItemAsync_DeletesExistingTodo()
    {
        // Act
        var result = await _todoService.DeleteTodoItemAsync(1, _testUserId);

        // Assert
        Assert.True(result);

        // Verify it was deleted from database
        var deletedTodo = await _context.TodoItems.FindAsync(1);
        Assert.Null(deletedTodo);
    }

    [Fact]
    public async Task DeleteTodoItemAsync_ReturnsFalseForNonExistentTodo()
    {
        // Act
        var result = await _todoService.DeleteTodoItemAsync(999, _testUserId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ToggleCompletionAsync_TogglesCompletionStatus()
    {
        // Act - Toggle to completed
        var result = await _todoService.ToggleCompletionAsync(1, _testUserId);

        // Assert
        Assert.True(result);

        var updatedTodo = await _context.TodoItems.FindAsync(1);
        Assert.NotNull(updatedTodo);
        Assert.True(updatedTodo.IsCompleted);
        Assert.NotNull(updatedTodo.CompletedAt);

        // Act - Toggle back to incomplete
        var result2 = await _todoService.ToggleCompletionAsync(1, _testUserId);

        // Assert
        Assert.True(result2);

        var updatedTodo2 = await _context.TodoItems.FindAsync(1);
        Assert.NotNull(updatedTodo2);
        Assert.False(updatedTodo2.IsCompleted);
        Assert.Null(updatedTodo2.CompletedAt);
    }

    [Fact]
    public async Task GetTodoItemsCountAsync_ReturnsCorrectCount()
    {
        // Act
        var count = await _todoService.GetTodoItemsCountAsync(_testUserId);

        // Assert
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task GetCompletedTodoItemsCountAsync_ReturnsCorrectCount()
    {
        // Arrange - Mark existing todo as completed
        var todo = await _context.TodoItems.FindAsync(1);
        todo!.IsCompleted = true;
        todo.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Act
        var count = await _todoService.GetCompletedTodoItemsCountAsync(_testUserId);

        // Assert
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task GetOverdueTodoItemsCountAsync_ReturnsCorrectCount()
    {
        // Arrange - Create overdue todo
        var overdueTodo = new TodoItem
        {
            Title = "Overdue Todo",
            Description = "This is overdue",
            IsCompleted = false,
            Priority = Priority.Medium,
            DueDate = DateTime.UtcNow.AddDays(-1), // Yesterday
            UserId = _testUserId,
            CategoryId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.TodoItems.Add(overdueTodo);
        await _context.SaveChangesAsync();

        // Act
        var count = await _todoService.GetOverdueTodoItemsCountAsync(_testUserId);

        // Assert
        Assert.Equal(1, count);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
