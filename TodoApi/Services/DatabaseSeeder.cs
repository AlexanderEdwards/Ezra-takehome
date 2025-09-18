using Microsoft.AspNetCore.Identity;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Services;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext context,
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Ensure database is created
            await _context.Database.EnsureCreatedAsync();

            // Seed roles
            await SeedRolesAsync();

            // Seed admin user
            var adminUser = await SeedAdminUserAsync();

            // Seed test data for admin user
            if (adminUser != null)
            {
                await SeedTestDataAsync(adminUser);
            }

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private async Task SeedRolesAsync()
    {
        var roles = new[] { "Admin", "User" };

        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
                _logger.LogInformation("Created role: {Role}", role);
            }
        }
    }

    private async Task<User?> SeedAdminUserAsync()
    {
        const string adminEmail = "admin@todoapp.com";
        const string adminPassword = "Admin123!";

        var adminUser = await _userManager.FindByEmailAsync(adminEmail);
        
        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "Admin",
                LastName = "User",
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(adminUser, adminPassword);
            
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(adminUser, "Admin");
                _logger.LogInformation("Created admin user: {Email}", adminEmail);
            }
            else
            {
                _logger.LogError("Failed to create admin user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
                return null;
            }
        }

        return adminUser;
    }

    private async Task SeedTestDataAsync(User adminUser)
    {
        // Check if admin user already has test data
        var existingTodosCount = _context.TodoItems.Count(t => t.UserId == adminUser.Id);
        
        if (existingTodosCount >= 50)
        {
            _logger.LogInformation("Admin user already has {Count} todos, skipping test data seeding", existingTodosCount);
            return;
        }

        _logger.LogInformation("Seeding test data for admin user...");

        // Create categories (they will be saved automatically in SeedCategoriesAsync)
        var categories = await SeedCategoriesAsync(adminUser.Id);

        // Now create todos with the saved category IDs
        await SeedTodosAsync(adminUser.Id, categories);
        await _context.SaveChangesAsync(); // Save todos
        
        var totalTodos = _context.TodoItems.Count(t => t.UserId == adminUser.Id);
        _logger.LogInformation("Seeded test data: {TodoCount} todos, {CategoryCount} categories", 
            totalTodos, categories.Count);
    }

    private async Task<List<Category>> SeedCategoriesAsync(string userId)
    {
        var categoryData = new[]
        {
            ("Work", "Work related tasks and projects", "#3B82F6"),
            ("Personal", "Personal tasks and goals", "#10B981"),
            ("Shopping", "Shopping lists and purchases", "#F59E0B"),
            ("Health", "Health and fitness goals", "#EF4444"),
            ("Learning", "Educational and skill development", "#8B5CF6"),
            ("Travel", "Travel planning and activities", "#06B6D4"),
            ("Home", "Home maintenance and projects", "#84CC16"),
            ("Finance", "Financial planning and management", "#F97316")
        };

        var categories = new List<Category>();
        var newCategories = new List<Category>();

        foreach (var (name, description, color) in categoryData)
        {
            var existingCategory = _context.Categories.FirstOrDefault(c => c.Name == name && c.UserId == userId);
            
            if (existingCategory == null)
            {
                var category = new Category
                {
                    Name = name,
                    Description = description,
                    Color = color,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                newCategories.Add(category);
                _context.Categories.Add(category);
            }
            else
            {
                categories.Add(existingCategory);
            }
        }

        // Save new categories to get their IDs
        if (newCategories.Any())
        {
            await _context.SaveChangesAsync();
            categories.AddRange(newCategories);
        }

        return categories;
    }

    private async Task SeedTodosAsync(string userId, List<Category> categories)
    {
        var todoTasks = new[]
        {
            ("Review quarterly reports", "Analyze Q3 performance metrics and prepare comprehensive summary for stakeholders"),
            ("Update project documentation", "Ensure all API endpoints are properly documented with examples and error codes"),
            ("Schedule team meeting", "Coordinate with all team members for weekly standup and sprint planning session"),
            ("Buy groceries for the week", "Milk, bread, eggs, vegetables, fruits, and other essentials for healthy meals"),
            ("Complete morning exercise routine", "30-minute cardio workout followed by strength training and stretching"),
            ("Read Clean Architecture book", "Continue reading Robert Martin's book and take notes on key principles"),
            ("Plan summer vacation trip", "Research destinations, compare prices, and book flights and accommodations"),
            ("Fix kitchen faucet leak", "Replace the washer, check for other plumbing issues, and test water pressure"),
            ("Pay monthly utility bills", "Electricity, internet, phone, water, and credit card payments due this week"),
            ("Learn React Native framework", "Complete tutorial series and build a sample mobile application"),
            ("Organize home workspace", "Clean desk, organize cables, update filing system, and improve ergonomics"),
            ("Schedule dental checkup", "Book annual cleaning and examination appointment with dental hygienist"),
            ("Review investment portfolio", "Check performance metrics, rebalance allocations, and research new opportunities"),
            ("Update professional resume", "Add recent projects, skills, and achievements to LinkedIn and resume documents"),
            ("Plan birthday celebration", "Book venue, send invitations, arrange catering, and coordinate with guests"),
            ("Backup important files", "Create comprehensive cloud backup of photos, documents, and project files"),
            ("Service car maintenance", "Oil change, tire rotation, brake inspection, and general maintenance check"),
            ("Write technical blog post", "Share insights about recent project challenges, solutions, and lessons learned"),
            ("Organize digital photo albums", "Sort and categorize vacation photos, family events, and special moments"),
            ("Research productivity tools", "Evaluate project management software options and collaboration tools for team"),
            ("Prepare client presentation", "Create compelling slides for upcoming business proposal and practice delivery"),
            ("Declutter bedroom closet", "Donate clothes that no longer fit, organize seasonal items, and maximize space"),
            ("Study for AWS certification", "Complete online course modules, practice exams, and hands-on labs"),
            ("Plan weekly meal prep", "Design healthy meal plans, create shopping list, and batch cook for efficiency"),
            ("Update home security system", "Change passwords, review camera settings, and test alarm functionality"),
            ("Tend to garden plants", "Water plants, prune overgrown branches, plant seasonal flowers, and fertilize soil"),
            ("Compare insurance policies", "Research rates and coverage options for auto, home, and health insurance"),
            ("Organize computer files", "Clean downloads folder, organize project directories, and optimize storage space"),
            ("Book annual medical checkup", "Schedule comprehensive physical exam, blood work, and specialist consultations"),
            ("Practice Spanish language", "Continue daily lessons on language app, practice conversations, and review grammar"),
            ("Plan kitchen renovation", "Get contractor quotes, research materials, design layout, and set project timeline"),
            ("Upgrade home network", "Update router firmware, optimize WiFi coverage, and improve internet security"),
            ("Coordinate volunteer project", "Organize community service event, recruit volunteers, and coordinate logistics"),
            ("Create financial budget", "Review expenses, set savings goals, track spending, and plan for future investments"),
            ("Solve coding challenges", "Practice algorithm problems, improve problem-solving skills, and learn new techniques"),
            ("Audit social media accounts", "Review privacy settings, clean up old posts, and optimize professional profiles"),
            ("Prepare emergency kit", "Update emergency supplies, review evacuation plan, and ensure family preparedness"),
            ("Prepare for book club", "Read assigned chapters, research historical context, and prepare discussion questions"),
            ("Research laptop upgrade", "Compare specifications, read reviews, check compatibility, and find best deals"),
            ("Connect with friends", "Schedule video calls, plan meetups, send messages, and maintain relationships"),
            ("Edit photography portfolio", "Process recent shoots, select best images, create online gallery, and print favorites"),
            ("Track health metrics", "Monitor daily exercise, nutrition intake, sleep patterns, and wellness goals"),
            ("Document project learnings", "Write technical documentation, share knowledge with team, and create tutorials"),
            ("Attend town hall meeting", "Participate in local government session and neighborhood watch coordination"),
            ("Explore freelance opportunities", "Research web development projects, update portfolio, and network with clients"),
            ("Implement eco-friendly practices", "Research sustainable living options, reduce waste, and adopt green technologies"),
            ("Visit art museum exhibition", "Explore new gallery opening, attend cultural events, and support local artists"),
            ("Complete personality assessment", "Take professional evaluation, analyze results, and create personal development plan"),
            ("Update estate planning", "Review will, update beneficiaries, organize important documents, and consult attorney"),
            ("Research emerging technologies", "Study AI trends, blockchain developments, and industry innovation opportunities")
        };

        var priorities = new[] { Priority.Low, Priority.Medium, Priority.High, Priority.Critical };
        var random = new Random(42); // Fixed seed for consistent test data

        // Create 120 todos to test pagination thoroughly
        var todos = new List<TodoItem>();
        
        for (int i = 0; i < 120; i++)
        {
            var taskIndex = i % todoTasks.Length;
            var (title, description) = todoTasks[taskIndex];
            
            // Add variation to titles to make them unique
            var uniqueTitle = i < todoTasks.Length ? title : $"{title} (Task #{i + 1})";
            
            var createdDate = DateTime.UtcNow.AddDays(random.Next(-90, -1)); // Created 1-90 days ago
            var updatedDate = createdDate.AddDays(random.Next(0, Math.Min(7, (DateTime.UtcNow - createdDate).Days + 1)));
            var isCompleted = random.NextDouble() < 0.25; // 25% chance of being completed
            
            var todo = new TodoItem
            {
                Title = uniqueTitle,
                Description = description,
                IsCompleted = isCompleted,
                Priority = priorities[random.Next(priorities.Length)],
                DueDate = DateTime.UtcNow.AddDays(random.Next(-15, 45)), // Due date between 15 days ago and 45 days from now
                CategoryId = categories[random.Next(categories.Count)].Id,
                UserId = userId,
                CreatedAt = createdDate,
                UpdatedAt = updatedDate
            };

            // Set completion date for completed todos
            if (isCompleted)
            {
                todo.CompletedAt = updatedDate.AddHours(random.Next(1, 48));
            }

            todos.Add(todo);
        }

        _context.TodoItems.AddRange(todos);
    }
}
