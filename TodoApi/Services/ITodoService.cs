using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public interface ITodoService
{
    Task<PaginatedResponse<TodoItemResponseDto>> GetTodoItemsAsync(string userId, TodoItemQueryDto query);
    Task<TodoItemResponseDto?> GetTodoItemByIdAsync(int id, string userId);
    Task<TodoItemResponseDto> CreateTodoItemAsync(CreateTodoItemDto dto, string userId);
    Task<TodoItemResponseDto?> UpdateTodoItemAsync(int id, UpdateTodoItemDto dto, string userId);
    Task<bool> DeleteTodoItemAsync(int id, string userId);
    Task<bool> ToggleCompletionAsync(int id, string userId);
    Task<int> GetTodoItemsCountAsync(string userId);
    Task<int> GetCompletedTodoItemsCountAsync(string userId);
    Task<int> GetOverdueTodoItemsCountAsync(string userId);
}
