using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using TodoApi.Controllers;
using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Unit;

public class TodoControllerUnitTests
{
    private readonly Mock<ITodoService> _mockTodoService;
    private readonly Mock<ILogger<TodoController>> _mockLogger;
    private readonly TodoController _controller;
    private readonly string _testUserId = "test-user-id";

    public TodoControllerUnitTests()
    {
        _mockTodoService = new Mock<ITodoService>();
        _mockLogger = new Mock<ILogger<TodoController>>();
        _controller = new TodoController(_mockTodoService.Object, _mockLogger.Object);

        // Set up user context
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    [Fact]
    public async Task GetTodoItems_ReturnsOkResult_WithTodos()
    {
        // Arrange
        var query = new TodoItemQueryDto { Page = 1, PageSize = 10 };
        var mockResponse = new PaginatedResponse<TodoItemResponseDto>
        {
            Items = new List<TodoItemResponseDto>
            {
                new TodoItemResponseDto
                {
                    Id = 1,
                    Title = "Test Todo",
                    Description = "Test Description",
                    IsCompleted = false,
                    Priority = Priority.Medium,
                    PriorityName = "Medium",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            TotalCount = 1,
            Page = 1,
            PageSize = 10
        };

        _mockTodoService.Setup(s => s.GetTodoItemsAsync(_testUserId, query))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _controller.GetTodoItems(query);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<PaginatedResponse<TodoItemResponseDto>>(okResult.Value);
        Assert.Single(returnValue.Items);
        Assert.Equal("Test Todo", returnValue.Items.First().Title);
    }

    [Fact]
    public async Task GetTodoItem_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var todoId = 1;
        var mockTodo = new TodoItemResponseDto
        {
            Id = todoId,
            Title = "Test Todo",
            Description = "Test Description",
            IsCompleted = false,
            Priority = Priority.Medium,
            PriorityName = "Medium",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockTodoService.Setup(s => s.GetTodoItemByIdAsync(todoId, _testUserId))
            .ReturnsAsync(mockTodo);

        // Act
        var result = await _controller.GetTodoItem(todoId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<TodoItemResponseDto>(okResult.Value);
        Assert.Equal("Test Todo", returnValue.Title);
    }

    [Fact]
    public async Task GetTodoItem_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var todoId = 999;
        _mockTodoService.Setup(s => s.GetTodoItemByIdAsync(todoId, _testUserId))
            .ReturnsAsync((TodoItemResponseDto?)null);

        // Act
        var result = await _controller.GetTodoItem(todoId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("Todo item not found", ((dynamic)notFoundResult.Value!).message);
    }

    [Fact]
    public async Task CreateTodoItem_ValidData_ReturnsCreatedResult()
    {
        // Arrange
        var createDto = new CreateTodoItemDto
        {
            Title = "New Todo",
            Description = "New Description",
            Priority = Priority.High,
            DueDate = DateTime.UtcNow.AddDays(1),
            CategoryId = 1
        };

        var mockResponse = new TodoItemResponseDto
        {
            Id = 1,
            Title = "New Todo",
            Description = "New Description",
            IsCompleted = false,
            Priority = Priority.High,
            PriorityName = "High",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockTodoService.Setup(s => s.CreateTodoItemAsync(createDto, _testUserId))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _controller.CreateTodoItem(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(TodoController.GetTodoItem), createdResult.ActionName);
        var returnValue = Assert.IsType<TodoItemResponseDto>(createdResult.Value);
        Assert.Equal("New Todo", returnValue.Title);
    }

    [Fact]
    public async Task UpdateTodoItem_ValidData_ReturnsOkResult()
    {
        // Arrange
        var todoId = 1;
        var updateDto = new UpdateTodoItemDto
        {
            Title = "Updated Todo",
            Description = "Updated Description",
            IsCompleted = true,
            Priority = Priority.Critical,
            DueDate = DateTime.UtcNow.AddDays(2),
            CategoryId = 1
        };

        var mockResponse = new TodoItemResponseDto
        {
            Id = todoId,
            Title = "Updated Todo",
            Description = "Updated Description",
            IsCompleted = true,
            Priority = Priority.Critical,
            PriorityName = "Critical",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        _mockTodoService.Setup(s => s.UpdateTodoItemAsync(todoId, updateDto, _testUserId))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _controller.UpdateTodoItem(todoId, updateDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<TodoItemResponseDto>(okResult.Value);
        Assert.Equal("Updated Todo", returnValue.Title);
        Assert.True(returnValue.IsCompleted);
    }

    [Fact]
    public async Task DeleteTodoItem_ExistingId_ReturnsNoContent()
    {
        // Arrange
        var todoId = 1;
        _mockTodoService.Setup(s => s.DeleteTodoItemAsync(todoId, _testUserId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteTodoItem(todoId);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteTodoItem_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var todoId = 999;
        _mockTodoService.Setup(s => s.DeleteTodoItemAsync(todoId, _testUserId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteTodoItem(todoId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Todo item not found", ((dynamic)notFoundResult.Value!).message);
    }

    [Fact]
    public async Task ToggleCompletion_ExistingId_ReturnsOk()
    {
        // Arrange
        var todoId = 1;
        _mockTodoService.Setup(s => s.ToggleCompletionAsync(todoId, _testUserId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ToggleCompletion(todoId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Todo item completion status toggled successfully", ((dynamic)okResult.Value!).message);
    }

    [Fact]
    public async Task GetTodoStats_ReturnsOkWithStats()
    {
        // Arrange
        _mockTodoService.Setup(s => s.GetTodoItemsCountAsync(_testUserId))
            .ReturnsAsync(10);
        _mockTodoService.Setup(s => s.GetCompletedTodoItemsCountAsync(_testUserId))
            .ReturnsAsync(6);
        _mockTodoService.Setup(s => s.GetOverdueTodoItemsCountAsync(_testUserId))
            .ReturnsAsync(2);

        // Act
        var result = await _controller.GetTodoStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = okResult.Value;
        
        // Use reflection to check the anonymous object properties
        var statsType = stats!.GetType();
        Assert.Equal(10, statsType.GetProperty("total")!.GetValue(stats));
        Assert.Equal(6, statsType.GetProperty("completed")!.GetValue(stats));
        Assert.Equal(4, statsType.GetProperty("pending")!.GetValue(stats));
        Assert.Equal(2, statsType.GetProperty("overdue")!.GetValue(stats));
        Assert.Equal(60.0, statsType.GetProperty("completionRate")!.GetValue(stats));
    }

    [Fact]
    public async Task CreateTodoItem_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var createDto = new CreateTodoItemDto
        {
            Title = "New Todo",
            Description = "New Description",
            Priority = Priority.Medium
        };

        _mockTodoService.Setup(s => s.CreateTodoItemAsync(createDto, _testUserId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateTodoItem(createDto);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusResult.StatusCode);
        Assert.Equal("An error occurred while creating the todo item", ((dynamic)statusResult.Value!).message);
    }
}
