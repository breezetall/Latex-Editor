using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Latex_Editor
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AccessController : ControllerBase
    {
        private readonly LatexDbContext _context;

        public AccessController(LatexDbContext context)
        {
            _context = context;
        }

        [HttpPost("share")]
        public async Task<IActionResult> ShareFile([FromBody] ShareRequestDto request)
        {
            var currentUserId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var file = await _context.Latexes.FindAsync(request.FileId);
            if (file == null) return NotFound("File not found.");

            // Ownership check
            if (file.UserId != currentUserId)
            {
                return Forbid("You do not have permission to share this file.");
            }

            var newShare = new FileShare
            {
                FileId = request.FileId,
                SharedWithEmail = request.Email,
                PermissionLevel = request.Permission
            };

            _context.FileShares.Add(newShare);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"File shared with {request.Email}" });
        }

        [HttpDelete("revoke/{shareId}")]
        public async Task<IActionResult> RevokeAccess(Guid shareId)
        {
            var shareRecord = await _context.FileShares.FindAsync(shareId);
            if (shareRecord == null) return NotFound();

            var currentUserId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var file = await _context.Latexes.FindAsync(shareRecord.FileId);
            
            // Only Owner can revoke
            if (file == null || file.UserId != currentUserId)
            {
                return Forbid("Only the owner can revoke access.");
            }

            _context.FileShares.Remove(shareRecord);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
