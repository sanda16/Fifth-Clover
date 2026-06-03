// Entry point configuration. 
// Gents, ensure CORS is permissive for local testing so the Vite frontend does not get blocked.
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register HTTP Clients for dependency injection
builder.Services.AddHttpClient("PocketBase", client =>
{
    // Default local PocketBase port
    client.BaseAddress = new Uri("http://127.0.0.1:8090/api/");
});

builder.Services.AddHttpClient("PythonML", client =>
{
    // The bridge to the Data Science engine
    client.BaseAddress = new Uri("http://127.0.0.1:8000/");
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();