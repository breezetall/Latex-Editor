using Latex_Editor;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LatexController : ControllerBase
{
    private readonly LatexDbContext _context;

    public LatexController(LatexDbContext context)
    {
        _context = context;
    }

    // --- Access Helper Logic ---
    private string GetUserId()
    {
        var sub = User.FindFirst("sub")?.Value;
        if (sub != null) return sub;

        var nameId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (nameId != null) return nameId;

        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        if (name != null) return name;

        return "Unknown id";
    }

    private string? GetUserEmail()
    {
        return User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
               ?? User.FindFirst(ClaimTypes.Email)?.Value;
    }

    private async Task<bool> CanAccessFile(int fileId, bool requireEdit = false)
    {
        var userId = GetUserId();
        var email = GetUserEmail();

        // Check if Owner
        var isOwner = await _context.Latexes.AnyAsync(l => l.Id == fileId && l.UserId == userId);
        if (isOwner) return true;

        // Check if Shared
        var share = await _context.FileShares.FirstOrDefaultAsync(s => s.FileId == fileId && s.SharedWithEmail == email);
        if (share == null) return false;

        // If we specifically need Edit permissions
        if (requireEdit) return share.PermissionLevel == PermissionLevel.Edit;

        return true; // Has at least View access
    }

    // GET api/latex
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetFiles()
    {
        var userId = GetUserId();
        var email = GetUserEmail();

        return Ok(await _context.Latexes
            .Where(l => l.UserId == userId || _context.FileShares.Any(s => s.FileId == l.Id && s.SharedWithEmail == email))
            .OrderBy(l => l.Name)
            .Select(l => new { id = l.Id, name = l.Name })
            .ToListAsync());
    }

    // GET api/latex/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LatexDto>> GetById(int id)
    {
        if (!await CanAccessFile(id)) 
            return NotFound();

        var file = await _context.Latexes.FirstOrDefaultAsync(l => l.Id == id);

        if (file == null)
            return NotFound();

        return new LatexDto
        {
            Name = file.Name,
            Text = file.Text,
            Id = id
        };
    }

    // POST api/latex
    //[HttpPost]
    //public async Task<ActionResult<LatexDto>> Save([FromBody] LatexDto dto)
    //{
    //    if (string.IsNullOrWhiteSpace(dto.Name))
    //        return BadRequest("Name required");

    //    var userId = GetUserId();
    //    Latex? doc = null;

    //    if (dto.Id > 0)
    //    {
    //        // Update
    //        // Check permission: Must be owner or have Edit access
    //        if (!await CanAccessFile(dto.Id, requireEdit: true))
    //            return Forbid("You do not have edit permission for this document.");

    //        doc = await _context.Latexes.FirstOrDefaultAsync(l => l.Id == dto.Id);

    //        if (doc == null) return NotFound("Document not found");

    //        // unique name across users
    //        //if (await _context.Latexes.AnyAsync(l => l.Id == dto.Id && l.UserId != userId))
    //        //    return Conflict("Another document already has this name");
    //    }
    //    else
    //    {
    //        // Insert
    //        if (await _context.Latexes.AnyAsync(l => l.Name == dto.Name && l.UserId == userId))
    //            return Conflict("A document with this name already exists.");

    //        doc = new Latex { UserId = userId };
    //        _context.Latexes.Add(doc);
    //    }

    //    doc.Name = dto.Name;
    //    doc.Text = dto.Text ?? "";

    //    // Second line of defence
    //    try
    //    {
    //        await _context.SaveChangesAsync();
    //    }
    //    catch (DbUpdateException ex)
    //    {
    //        return Conflict("Name already exists (Database collision)");
    //    }

    //    return Ok(new LatexDto
    //    {
    //        Id = doc.Id,
    //        Name = doc.Name,
    //        Text = doc.Text,
    //    });
    //}

    [HttpPost]
    public async Task<ActionResult<LatexDto>> Save([FromBody] LatexDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name required");

        var userId = GetUserId();
        Latex? doc = null;

        if (dto.Id > 0)
        {
            if (!await CanAccessFile(dto.Id, requireEdit: true))
                return Forbid("You do not have edit permission for this document.");

            doc = await _context.Latexes.FirstOrDefaultAsync(l => l.Id == dto.Id);
            if (doc == null) return NotFound("Document not found");

            doc.Name = dto.Name;

            // Update Text if no yjs found
            if (doc.Yjs_State == null || doc.Yjs_State.Length == 0)
            {
                doc.Text = dto.Text ?? "";
            }

            doc.Last_Updated = DateTime.UtcNow;
        }
        else
        {
            if (await _context.Latexes.AnyAsync(l => l.Name == dto.Name && l.UserId == userId))
                return Conflict("A document with this name already exists.");

            doc = new Latex
            {
                UserId = userId,
                Name = dto.Name,
                Text = dto.Text ?? "",
                Created = DateTime.UtcNow,
                Last_Updated = DateTime.UtcNow
            };
            _context.Latexes.Add(doc);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict("Database collision");
        }

        return Ok(new LatexDto
        {
            Id = doc.Id,
            Name = doc.Name,
            Text = doc.Text,
        });
    }

    // DELETE api/latex/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        
        // Only owner can delete
        var file = await _context.Latexes
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (file == null)
            return NotFound();

        _context.Latexes.Remove(file);
        await _context.SaveChangesAsync();
        return Ok();
    }
}