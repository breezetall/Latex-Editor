namespace Latex_Editor
{
    public class ShareRequestDto
    {
        public int FileId { get; set; }
        public string Email { get; set; } = string.Empty;
        public PermissionLevel Permission { get; set; }
    }
}
