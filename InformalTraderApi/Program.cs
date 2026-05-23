// Database: SASENTSIGUSA
namespace InformalTraderApi;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Register standard Controllers and OpenAPI
        builder.Services.AddControllers();
        builder.Services.AddOpenApi();

        // 1. ADD SWAGGER GENERATOR TO CONTAINER
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        // Register HttpClient configured for your local PocketBase REST API
        builder.Services.AddHttpClient("PocketBase", client =>
        {
            client.BaseAddress = new Uri("http://127.0.0.1:8090/api/");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        });

        var app = builder.Build();

        // 2. ENABLE SWAGGER UI IN DEVELOPMENT MODE
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                // Sets the Swagger page as the default root launch URL page
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartCash Omni API v1");
                options.RoutePrefix = string.Empty;
            });
        }

        app.UseHttpsRedirection();
        app.UseAuthorization();

        // Map Controller routes automatically
        app.MapControllers();

        app.Run();
    }
}