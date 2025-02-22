// This middleware tracks the time of the last request from each IP address. If an IP tries to make
// too many requests within one minute, it blocks them with a 429 status. This is done by using a
// concurrent dictionary to store each IP's requests timestamps and keeping track of how many theyve
// made within 60 seconds

using System.Collections.Concurrent;

namespace inapinch.Middleware
{
    public class IpTrackingMiddleware
    {
        // Store the request timestamps by IP address
        private static readonly ConcurrentDictionary<string, List<DateTime>> IpAccessTimes = new();
        private readonly RequestDelegate _next;

        // Rate limit per minute for POST PUT and DELETE
        private const int MaxRequestsPerMinute = 600;

        public IpTrackingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (ipAddress == null) return;

            // Only apply rate limiting to POST PUT and DELETE requests
            if (context.Request.Method != HttpMethod.Post.Method &&
                context.Request.Method != HttpMethod.Put.Method &&
                context.Request.Method != HttpMethod.Delete.Method)
            {
                await _next(context);
                return;
            }

            // Initialize the request tracking for this IP
            if (!IpAccessTimes.ContainsKey(ipAddress))
            {
                IpAccessTimes[ipAddress] = new List<DateTime>();
            }

            var requestTimestamps = IpAccessTimes[ipAddress];

            // Remove requests older than 1 minute
            requestTimestamps.RemoveAll(timestamp => (DateTime.UtcNow - timestamp).TotalMinutes > 1);

            // Check if the number of requests exceeds the limit
            if (requestTimestamps.Count >= MaxRequestsPerMinute)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.Response.WriteAsync("Too many requests from this IP.");
                return;
            }

            // Track the current request timestamp
            requestTimestamps.Add(DateTime.UtcNow);

            // Store the updated timestamps back in the dictionary
            IpAccessTimes[ipAddress] = requestTimestamps;

            await _next(context);
        }
    }
}