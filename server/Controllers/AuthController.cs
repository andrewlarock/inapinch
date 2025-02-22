using Microsoft.AspNetCore.Mvc;
using FirebaseAdmin.Auth;
using Swashbuckle.AspNetCore.Annotations;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    [HttpPost("validate")]
    [SwaggerOperation(Summary = "Validates a Firebase token", Description = "This endpoint validates a Firebase token to authenticate the user, ensuring they are authorized to make further API requests.")]
    public async Task<IActionResult> ValidateToken([FromBody] TokenRequest request)
    {
        try
        {
            // Validate the token with Firebase
            var decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.Token);

            return Ok(new
            {
                Message = "Token is valid",
                Uid = decodedToken.Uid, // Firebase UID
                Claims = decodedToken.Claims // Custom claims
            });
        }
        catch (FirebaseAuthException ex)
        {
            return Unauthorized(new
            {
                Message = "Invalid token",
                Error = ex.Message
            });
        }
    }
}

public class TokenRequest
{
    public string Token { get; set; }
}