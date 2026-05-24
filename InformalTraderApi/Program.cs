// Database: SASENTSIGUSA
namespace InformalTraderApi;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // 1. ADD CORS POLICY FOR LOCAL FRONTEND DEV
        // This stops the browser from blocking your React app when it tries to talk to this API
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        // Register standard Controllers and OpenAPI
        builder.Services.AddControllers();
        builder.Services.AddOpenApi();

        // 2. ADD SWAGGER GENERATOR TO CONTAINER
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        // Register HttpClient configured for your local PocketBase REST API
        builder.Services.AddHttpClient("PocketBase", client =>
        {
            client.BaseAddress = new Uri("http://127.0.0.1:8090/api/");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        });

        var app = builder.Build();

        // 3. ENABLE SWAGGER UI IN DEVELOPMENT MODE
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

        // Skip HTTPS redirection in Development so the Vite proxy (which talks
        // to the HTTP endpoint on :5221) doesn't get bounced with 307 redirects.
        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        // 4. APPLY THE CORS POLICY 
        // Order is critical here: UseCors must go BEFORE UseAuthorization and MapControllers
        app.UseCors("AllowAll");

        app.UseAuthorization();

        // Map Controller routes automatically
        app.MapControllers();

        app.Run();
    }
}