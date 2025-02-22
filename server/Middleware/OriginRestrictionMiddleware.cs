// This middleware blocks all non-frontend requests. This ensures that even if someone finds the API URL,
// they cant use it unless the request is from the frontend.


public class OriginRestrictionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string[] _allowedOrigins = { "https://inapinch.app" }; // Allowed frontend origin

    public OriginRestrictionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        var origin = context.Request.Headers["Origin"].ToString();
        var referer = context.Request.Headers["Referer"].ToString();

        // Allow requests only if they come from the allowed origin
        if (!_allowedOrigins.Contains(origin) && !_allowedOrigins.Any(referer.StartsWith))
        {
            context.Response.StatusCode = 403; // Forbidden
            await context.Response.WriteAsync("Access denied. Public API access is blocked.");
            return;
        }

        await _next(context);
    }
}