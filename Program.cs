using Microsoft.EntityFrameworkCore;
using TraderWallet.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// --- Database: SQLite via EF Core -------------------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("Default") ?? "Data Source=traderwallet.db"));

// --- MVC controllers --------------------------------------------------------
builder.Services.AddControllers();

// --- Swagger / OpenAPI ------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "TraderWallet API", Version = "v1" }));

// --- CORS: allow any localhost origin so the frontend can call the API ------
const string CorsPolicy = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy => policy
        .SetIsOriginAllowed(origin => new Uri(origin).IsLoopback) // localhost / 127.0.0.1, any port
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// Create the SQLite database (no migrations) and seed demo data on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

// Swagger is always on (it's a hackathon demo, not production).
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(CorsPolicy);
app.MapControllers();

app.Run();
