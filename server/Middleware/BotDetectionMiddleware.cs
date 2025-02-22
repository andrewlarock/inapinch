// This middleware inspects the User-Agent header of incoming HTTP requests. It checks whether the
// request comes from a known bot/web scraper by matching the User-Agent string with a list of
// known suspicious bots

namespace inapinch.Middleware
{
    public class BotDetectionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string[] _blacklistedUserAgents = { "curl", "wget", "bot", "crawler", "spider", "scrapy", "python-requests", "java", "httpclient", "okhttp", "php" };

        public BotDetectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var userAgent = context.Request.Headers["User-Agent"].ToString().ToLower();
            if (_blacklistedUserAgents.Any(userAgent.Contains))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Forbidden: Bot detected.");
                return;
            }

            await _next(context);
        }
    }
}