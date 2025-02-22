using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
public class S3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string bucketName;

    public S3Service()
    {
        // Retrieve the bucket name from environment variables and initialize the s3Client
        bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME");
        _s3Client = new AmazonS3Client(RegionEndpoint.USEast2);
    }

    public async Task<string> GeneratePreSignedUrlAsync(string jobId, string photoType, int fileNumber, string fileExtension)
    {
        // Map file extension to content type (MIME type)
        var contentType = GetContentType(fileExtension);

        var key = $"{jobId}_{photoType}_{fileNumber}{fileExtension}";  // Include file extension in the key

        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(15), // URL expires in 15 minutes
            ContentType = contentType // Use dynamic content type
        };

        // Generate the pre-signed URL
        string url = _s3Client.GetPreSignedURL(request);
        return url;
    }

    // Helper method to map file extensions to content types
    private string GetContentType(string fileExtension)
    {
        return fileExtension.ToLower() switch
        {
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".webp" => "image/webp",
            ".tiff" => "image/tiff",
            _ => "application/octet-stream",  // Default for unknown types
        };
    }
}