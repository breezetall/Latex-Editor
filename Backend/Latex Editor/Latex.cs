using System.ComponentModel.DataAnnotations.Schema;

namespace Latex_Editor
{
    [Table("latex")]
    public class Latex
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public required string UserId { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;


        // Collab Service 
        public byte[]? Yjs_State { get; set; } 
        public int? Version { get; set; } = 1;
        public DateTime Last_Updated { get; set; } = DateTime.UtcNow;
    }
}
