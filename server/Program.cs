using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using AspNetCoreRateLimit;
using inapinch.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

// Add Swagger/OpenAPI services
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "In a Pinch API",
        Version = "v1",
        Description = "API documentation for the In a Pinch application"
    });

    // Enable support for annotations
    options.EnableAnnotations();
});

// Load configuration
builder.Services.AddOptions();
builder.Services.AddMemoryCache();

// Add rate limiting services
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddSingleton<S3Service>();

// Configure CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("https://inapinch.app")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Enable Swagger in production but disable api testing calls
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "In a Pinch API V1");
    options.RoutePrefix = "swagger";
    // Disable making public api calls through the swagger documentation
    options.ConfigObject.AdditionalItems["tryItOutEnabled"] = false;
    options.ConfigObject.AdditionalItems["supportedSubmitMethods"] = new string[] { }; // Removes Execute button
});

// Firebase admin SDK credentials
var credentialsJson = $@"
{{
    ""type"": ""service_account"",
    ""project_id"": ""{Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")}"",
    ""private_key_id"": ""{Environment.GetEnvironmentVariable("FIREBASE_PRIVATE_KEY_ID")}"",
    ""private_key"": ""{Environment.GetEnvironmentVariable("FIREBASE_PRIVATE_KEY")}"",
    ""client_email"": ""{Environment.GetEnvironmentVariable("FIREBASE_CLIENT_EMAIL")}"",
    ""client_id"": ""{Environment.GetEnvironmentVariable("FIREBASE_CLIENT_ID")}"",
    ""auth_uri"": ""{Environment.GetEnvironmentVariable("FIREBASE_AUTH_URI")}"",
    ""token_uri"": ""{Environment.GetEnvironmentVariable("FIREBASE_TOKEN_URI")}"",
    ""auth_provider_x509_cert_url"": ""{Environment.GetEnvironmentVariable("FIREBASE_AUTH_PROVIDER_CERT_URL")}"",
    ""client_x509_cert_url"": ""{Environment.GetEnvironmentVariable("FIREBASE_CLIENT_CERT_URL")}"",
    ""universe_domain"": ""googleapis.com""
}}";

// Initialize the firebase admin SDK
var credential = GoogleCredential.FromJson(credentialsJson);
FirebaseApp.Create(new AppOptions { Credential = credential });

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.UseIpRateLimiting();

app.UseMiddleware<BotDetectionMiddleware>();

app.UseMiddleware<IpTrackingMiddleware>();

app.UseMiddleware<OriginRestrictionMiddleware>();

app.MapGet("/", () => "Hello world! From AWS Beanstalk!");

app.Run();
