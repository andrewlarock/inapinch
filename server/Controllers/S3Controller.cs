using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Threading.Tasks;

[Route("s3")]
[ApiController]
public class S3Controller : ControllerBase
{
    private readonly S3Service _s3Service;

    public S3Controller(S3Service s3Service)
    {
        _s3Service = s3Service;
    }

    [HttpPost("generate-presigned-url")]
    [SwaggerOperation(Summary = "Generates a pre-signed URL for secure S3 uploads", Description = "This endpoint generates a pre-signed URL, allowing users to securely upload files directly to our S3 bucket.")]
    public async Task<IActionResult> GeneratePreSignedUrl([FromBody] GeneratePreSignedUrlRequest request)
    {
        if (string.IsNullOrEmpty(request.FileExtension) || string.IsNullOrEmpty(request.JobId) || string.IsNullOrEmpty(request.PhotoType) || request.FileNumber <= 0)
        {
            return BadRequest(new { error = "Invalid request parameters." });
        }

        try
        {
            // Update the method to use fileNumber and fileExtension
            string url = await _s3Service.GeneratePreSignedUrlAsync(request.JobId, request.PhotoType, request.FileNumber, request.FileExtension);
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Failed to generate pre-signed URL: {ex.Message}" });
        }
    }
}

public class GeneratePreSignedUrlRequest
{
    public string JobId { get; set; }
    public string PhotoType { get; set; }
    public int FileNumber { get; set; }
    public string FileExtension { get; set; }
}