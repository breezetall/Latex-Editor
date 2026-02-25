using System.ComponentModel.DataAnnotations.Schema;

namespace Latex_Editor
{
    public enum PermissionLevel { View, Edit }

    [Table("FileShares")]
    public class FileShare
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public int FileId { get; set; }
        public string SharedWithEmail { get; set; } = string.Empty;
        public PermissionLevel PermissionLevel { get; set; } = PermissionLevel.View;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
