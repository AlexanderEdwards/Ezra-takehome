using TodoApi.Models;

namespace TodoApi.Services;

public interface ITokenService
{
    Task<string> GenerateTokenAsync(User user);
    string? ValidateToken(string token);
}
