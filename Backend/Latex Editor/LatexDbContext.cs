using Microsoft.EntityFrameworkCore;


namespace Latex_Editor
{
    public class LatexDbContext : DbContext
    {
        public LatexDbContext(DbContextOptions<LatexDbContext> options)
            : base(options) { }

        public DbSet<Latex_Editor.Latex> Latexes => Set<Latex_Editor.Latex>();

        public DbSet<FileShare> FileShares => Set<FileShare>();
    }

}
