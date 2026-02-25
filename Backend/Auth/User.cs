using Microsoft.AspNetCore.Identity;

namespace Auth;

public class User : IdentityUser
{
    public string? DisplayName { get; set; }
    public DateTime AccountCreated { get; set; } = DateTime.UtcNow;
}