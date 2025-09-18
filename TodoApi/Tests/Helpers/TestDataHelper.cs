using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Tests.Helpers;

public static class TestDataHelper
{
    public static CreateTodoItemDto CreateValidTodoDto(int? categoryId = null)
    {
        return new CreateTodoItemDto
        {
            Title = "Test Todo Item",
            Description = "This is a test todo item",
            Priority = Priority.Medium,
            DueDate = DateTime.UtcNow.AddDays(7),
            CategoryId = categoryId
        };
    }

    public static UpdateTodoItemDto CreateValidUpdateTodoDto()
    {
        return new UpdateTodoItemDto
        {
            Title = "Updated Todo Item",
            Description = "This is an updated test todo item",
            Priority = Priority.High,
            IsCompleted = true,
            DueDate = DateTime.UtcNow.AddDays(3)
        };
    }

    public static CreateCategoryDto CreateValidCategoryDto()
    {
        return new CreateCategoryDto
        {
            Name = "Test Category",
            Description = "This is a test category",
            Color = "#3B82F6"
        };
    }

    public static RegisterUserDto CreateValidRegisterUserDto(string email = "test@example.com")
    {
        return new RegisterUserDto
        {
            Email = email,
            Password = "TestPassword123!",
            FirstName = "Test",
            LastName = "User"
        };
    }

    public static LoginUserDto CreateValidLoginUserDto(string email = "test@example.com")
    {
        return new LoginUserDto
        {
            Email = email,
            Password = "TestPassword123!"
        };
    }

    public static TodoItem CreateTodoEntity(string userId, int? categoryId = null)
    {
        return new TodoItem
        {
            Title = "Test Todo Entity",
            Description = "Test entity description",
            IsCompleted = false,
            Priority = Priority.Medium,
            DueDate = DateTime.UtcNow.AddDays(5),
            UserId = userId,
            CategoryId = categoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Category CreateCategoryEntity(string userId)
    {
        return new Category
        {
            Name = "Test Category Entity",
            Description = "Test category description",
            Color = "#10B981",
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static User CreateUserEntity(string email = "test@example.com")
    {
        return new User
        {
            UserName = email,
            Email = email,
            FirstName = "Test",
            LastName = "User",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Creates a collection of test todos with different properties for testing filters
    /// </summary>
    public static List<TodoItem> CreateTodoCollectionForFiltering(string userId, int categoryId)
    {
        return new List<TodoItem>
        {
            new TodoItem
            {
                Title = "High Priority Task",
                Description = "Important task to complete",
                IsCompleted = false,
                Priority = Priority.High,
                DueDate = DateTime.UtcNow.AddDays(1),
                UserId = userId,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new TodoItem
            {
                Title = "Completed Task",
                Description = "This task is done",
                IsCompleted = true,
                Priority = Priority.Medium,
                DueDate = DateTime.UtcNow.AddDays(-1),
                UserId = userId,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                CompletedAt = DateTime.UtcNow.AddDays(-1)
            },
            new TodoItem
            {
                Title = "Overdue Task",
                Description = "This task is overdue",
                IsCompleted = false,
                Priority = Priority.Critical,
                DueDate = DateTime.UtcNow.AddDays(-2),
                UserId = userId,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-7)
            },
            new TodoItem
            {
                Title = "Low Priority Future Task",
                Description = "Can be done later",
                IsCompleted = false,
                Priority = Priority.Low,
                DueDate = DateTime.UtcNow.AddDays(10),
                UserId = userId,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };
    }
}
