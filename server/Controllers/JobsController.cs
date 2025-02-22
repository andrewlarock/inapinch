using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using System.Net;
using Ganss.Xss;
using Swashbuckle.AspNetCore.Annotations;
using inapinch.Models;

namespace inapinch.Controllers
{
    [ApiController]
    [Route("jobs")]
    public class JobsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JobsController> _logger;
        private readonly S3Service _s3Service;
        public JobsController(IConfiguration configuration, ILogger<JobsController> logger, S3Service s3Service)
        {
            _configuration = configuration;
            _logger = logger;
            _s3Service = s3Service;
        }

        // Endpoint to add a job listing
        [HttpPost("add")]
        [SwaggerOperation(Summary = "Add a new job listing", Description = "Creates a new job entry in the Jobs table in SQL. The job is validated and sanitized before being added to the database.")]
        public async Task<IActionResult> AddJob([FromBody] JobRequest request)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    // Validate the job request
                    List<string> validationErrors = InputValidator.ValidateJobRequest(request);
                    if (validationErrors.Any())
                    {
                        return BadRequest(new { Message = "Validation failed", Errors = validationErrors });
                    }

                    connection.Open();

                    // Initialize an HTML/XSS sanitizer to sanitize custom user inputs
                    var sanitizer = new HtmlSanitizer();

                    // Create the original job_status value with Pending: Timestamp
                    string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
                    string jobStatus = $"[\"Pending: {timestamp}\"]";

                    // Sanitize every element in job_details, mainly for the custom instructions part which is user inputted
                    var sanitizedJobDetails = request.job_details.Select(item => WebUtility.HtmlDecode(sanitizer.Sanitize(item))).ToArray();

                    // Sanitize the custom_instructions which is user inputted
                    string sanitizedCustomInstructions = WebUtility.HtmlDecode(sanitizer.Sanitize(request.custom_instructions));

                    // Ensure that job_details and delivery_coords are valid JSON objects
                    string jobDetails = JsonConvert.SerializeObject(sanitizedJobDetails);
                    string deliveryCoords = JsonConvert.SerializeObject(request.delivery_coords);

                    // Ensure that before_photos is properly passed in and valid
                    List<string> photoUrls = request.before_photos;  // Now directly using the before_photos from request

                    // Ensure that the before_photos URLs are not empty
                    if (photoUrls == null || !photoUrls.Any())
                    {
                        return BadRequest(new { Message = "No photo URLs provided." });
                    }

                    // Serialize the photo URLs into JSON to be stored in the database
                    string beforePhotosJson = JsonConvert.SerializeObject(photoUrls);

                    // Insert the job data into the database
                    string query = @"INSERT INTO Jobs (job_id, customer_id, job_status, job_type, job_details, custom_instructions, delivery_address, scheduled_type, scheduled_time, size, before_photos, delivery_coords) 
                             VALUES (@job_id, @customer_id, @job_status, @job_type, @job_details, @custom_instructions, @delivery_address, @scheduled_type, @scheduled_time, @size, @before_photos, @delivery_coords)";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@job_id", request.job_id);
                        command.Parameters.AddWithValue("@customer_id", request.customer_id);
                        command.Parameters.AddWithValue("@job_status", jobStatus);
                        command.Parameters.AddWithValue("@job_type", request.job_type);
                        command.Parameters.AddWithValue("@job_details", jobDetails);
                        command.Parameters.AddWithValue("@custom_instructions", sanitizedCustomInstructions);
                        command.Parameters.AddWithValue("@delivery_address", request.delivery_address);
                        command.Parameters.AddWithValue("@scheduled_type", request.scheduled_type);
                        command.Parameters.AddWithValue("@scheduled_time", request.scheduled_time);
                        command.Parameters.AddWithValue("@size", request.size);
                        command.Parameters.AddWithValue("@before_photos", beforePhotosJson);
                        command.Parameters.AddWithValue("@delivery_coords", deliveryCoords);

                        command.ExecuteNonQuery();
                    }

                    return Ok(new { Message = "Job added successfully." });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint to get all jobs or jobs for a specific customer_id
        [HttpGet("get/{customerId?}")]
        [SwaggerOperation(Summary = "Retrieve all jobs or jobs for a specific customer", Description = "Fetches all job listings or jobs for a specific customer by their customer_id from the Jobs table in SQL. If no customer_id is provided, all jobs are returned.")]
        public IActionResult GetJobs(string? customerId = null)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Query to fetch all jobs or jobs for a specific customer
                    string query = customerId == null
                        ? "SELECT * FROM Jobs" // Fetch all jobs if no customerId is provided
                        : "SELECT * FROM Jobs WHERE customer_id = @customerId"; // Fetch jobs for a specific customer

                    using (var command = new MySqlCommand(query, connection))
                    {
                        // Add the parameter only if customerId is provided
                        if (customerId != null)
                        {
                            command.Parameters.AddWithValue("@customerId", customerId);
                        }

                        using (var reader = command.ExecuteReader())
                        {
                            var jobs = new List<object>();
                            while (reader.Read())
                            {
                                var job = new
                                {
                                    job_id = reader["job_id"],
                                    customer_id = reader["customer_id"],
                                    provider_id = reader["provider_id"] == DBNull.Value ? "" : reader["provider_id"].ToString(),
                                    job_status = JsonConvert.DeserializeObject<List<string>>(reader["job_status"].ToString()),
                                    job_type = reader["job_type"],
                                    job_details = JsonConvert.DeserializeObject<List<string>>(reader["job_details"].ToString()),
                                    custom_instructions = reader["custom_instructions"],
                                    delivery_address = reader["delivery_address"],
                                    delivery_coords = JsonConvert.DeserializeObject<Dictionary<string, string>>(reader["delivery_coords"].ToString()),
                                    scheduled_type = reader["scheduled_type"],
                                    scheduled_time = reader["scheduled_time"],
                                    size = reader["size"],
                                    before_photos = JsonConvert.DeserializeObject<List<string>>(reader["before_photos"].ToString()),
                                    after_photos = reader["after_photos"] != DBNull.Value
                                        ? JsonConvert.DeserializeObject<List<string>>(reader["after_photos"].ToString())
                                        : new List<string>(),
                                    feedback = reader["feedback"] == DBNull.Value ? "" : reader["feedback"].ToString(),
                                };
                                jobs.Add(job);
                            }
                            return Ok(jobs);
                        }
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint to get jobs for a specific provider_id
        [HttpGet("get-by-provider/{providerId}")]
        [SwaggerOperation(Summary = "Retrieve jobs for a specific provider", Description = "Fetches jobs for a specific provider by their provider_id from the Jobs table in SQL.")]
        public IActionResult GetJobsByProvider(string providerId)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Query to fetch jobs for a specific provider
                    string query = "SELECT * FROM Jobs WHERE provider_id = @providerId";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        // Add the parameter for providerId
                        command.Parameters.AddWithValue("@providerId", providerId);

                        using (var reader = command.ExecuteReader())
                        {
                            var jobs = new List<object>();
                            while (reader.Read())
                            {
                                var job = new
                                {
                                    job_id = reader["job_id"],
                                    customer_id = reader["customer_id"],
                                    provider_id = reader["provider_id"] == DBNull.Value ? "" : reader["provider_id"].ToString(),
                                    job_status = JsonConvert.DeserializeObject<List<string>>(reader["job_status"].ToString()),
                                    job_type = reader["job_type"],
                                    job_details = JsonConvert.DeserializeObject<List<string>>(reader["job_details"].ToString()),
                                    custom_instructions = reader["custom_instructions"],
                                    delivery_address = reader["delivery_address"],
                                    delivery_coords = JsonConvert.DeserializeObject<Dictionary<string, string>>(reader["delivery_coords"].ToString()),
                                    scheduled_type = reader["scheduled_type"],
                                    scheduled_time = reader["scheduled_time"],
                                    size = reader["size"],
                                    before_photos = JsonConvert.DeserializeObject<List<string>>(reader["before_photos"].ToString()),
                                    after_photos = reader["after_photos"] != DBNull.Value
                                        ? JsonConvert.DeserializeObject<List<string>>(reader["after_photos"].ToString())
                                        : new List<string>(),
                                    feedback = reader["feedback"] == DBNull.Value ? "" : reader["feedback"].ToString(),
                                };
                                jobs.Add(job);
                            }
                            return Ok(jobs);
                        }
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint to remove a job listing
        [HttpDelete("delete/{jobId}")]
        [SwaggerOperation(Summary = "Delete a job listing", Description = "Deletes a job listing permanently from the Jobs table. Only an existing job with the specified jobId will be deleted.")]
        public IActionResult DeleteJob(string jobId)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    string query = "DELETE FROM Jobs WHERE job_id = @jobId";

                    using (var command = new MySqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@jobId", jobId);

                        int rowsAffected = command.ExecuteNonQuery();

                        if (rowsAffected == 0)
                        {
                            return NotFound(new { Message = "Job not found." });
                        }

                        return Ok(new { Message = "Job deleted successfully." });
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint for providers to accept a job
        [HttpPut("accept")]
        [SwaggerOperation(Summary = "Provider accepts a job", Description = "This endpoint allows a provider to accept a job by providing the job_id and provider_id. Only available to providers.")]
        public IActionResult AcceptJob([FromBody] JobRequest request)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Check if the job exists
                    string checkQuery = "SELECT COUNT(*) FROM Jobs WHERE job_id = @jobId";
                    using (var checkCommand = new MySqlCommand(checkQuery, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@jobId", request.job_id);
                        int count = Convert.ToInt32(checkCommand.ExecuteScalar());

                        if (count == 0)
                        {
                            return NotFound(new { Message = "Job not found." });
                        }
                    }

                    // Update the provider_id for the job
                    string updateQuery = "UPDATE Jobs SET provider_id = @providerId WHERE job_id = @jobId";
                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@jobId", request.job_id);
                        updateCommand.Parameters.AddWithValue("@providerId", request.provider_id);

                        updateCommand.ExecuteNonQuery();
                    }

                    return Ok(new { Message = "Job accepted successfully." });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint to update job_status for a given job_id
        [HttpPut("update/{jobId}")]
        [SwaggerOperation(Summary = "Provider updates the job status of a job", Description = "Providers can update the job's status (e.g., Pending -> Accepted -> Completed) based on the job's current status. The status is prepended to the job's status list.")]
        public IActionResult UpdateJobStatus(string jobId)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Retrieve the current job_status for the specified job_id
                    string selectQuery = "SELECT job_status FROM Jobs WHERE job_id = @jobId";
                    string currentJobStatusJson;

                    using (var selectCommand = new MySqlCommand(selectQuery, connection))
                    {
                        selectCommand.Parameters.AddWithValue("@jobId", jobId);
                        currentJobStatusJson = selectCommand.ExecuteScalar() as string;

                        if (string.IsNullOrEmpty(currentJobStatusJson))
                        {
                            return NotFound(new { Message = $"Job with ID {jobId} not found." });
                        }
                    }

                    // Deserialize the job_status JSON into a list of strings
                    var currentJobStatus = JsonConvert.DeserializeObject<List<string>>(currentJobStatusJson);

                    if (currentJobStatus == null)
                    {
                        return StatusCode(500, new { Message = "Failed to parse job_status." });
                    }

                    // Determine the next status to prepend. Jobs get updated as follows: Pending -> Accepted -> Ordered
                    string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
                    string newStatus;

                    if (currentJobStatus.Count == 1) // If the job is currently pending
                    {
                        newStatus = $"Accepted: {timestamp}";
                    }
                    else if (currentJobStatus.Count == 2) // If the job is currently accepted
                    {
                        newStatus = $"Completed: {timestamp}";
                    }
                    else
                    {
                        return BadRequest(new { Message = "Job status cannot be updated. This job is already completed." });
                    }

                    // Prepend the new status to the array so the most recent update is always first
                    currentJobStatus.Insert(0, newStatus);

                    // Serialize the updated job_status back to JSON
                    string updatedJobStatusJson = JsonConvert.SerializeObject(currentJobStatus);

                    // Update the job_status in the database
                    string updateQuery = "UPDATE Jobs SET job_status = @job_status WHERE job_id = @jobId";

                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@job_status", updatedJobStatusJson);
                        updateCommand.Parameters.AddWithValue("@jobId", jobId);

                        int rowsAffected = updateCommand.ExecuteNonQuery();

                        if (rowsAffected == 0)
                        {
                            return NotFound(new { Message = $"Job with ID {jobId} not found." });
                        }
                    }

                    return Ok(new { Message = "Job status updated successfully.", UpdatedStatus = currentJobStatus });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint for a provider to cancel a job after theyve accepted it
        [HttpPut("cancel/{jobId}")]
        [SwaggerOperation(Summary = "Provider cancels a job", Description = "Allows a provider to cancel a job they've accepted. The job is removed from the provider, and the status is updated to reflect the cancellation.")]
        public IActionResult CancelJob(string jobId)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Retrieve the current job_status and provider_id for the specified job_id
                    string selectQuery = "SELECT job_status, provider_id FROM Jobs WHERE job_id = @jobId";
                    string currentJobStatusJson;
                    string providerId;

                    using (var selectCommand = new MySqlCommand(selectQuery, connection))
                    {
                        selectCommand.Parameters.AddWithValue("@jobId", jobId);
                        using (var reader = selectCommand.ExecuteReader())
                        {
                            if (!reader.Read())
                            {
                                return NotFound(new { Message = $"Job with ID {jobId} not found." });
                            }

                            currentJobStatusJson = reader["job_status"] as string;
                            providerId = reader["provider_id"] as string;
                        }
                    }

                    if (string.IsNullOrEmpty(providerId))
                    {
                        return BadRequest(new { Message = "Job is not assigned to any provider." });
                    }

                    // Deserialize the job_status JSON into a list of strings
                    var currentJobStatus = JsonConvert.DeserializeObject<List<string>>(currentJobStatusJson);

                    if (currentJobStatus == null || currentJobStatus.Count == 0)
                    {
                        return StatusCode(500, new { Message = "Failed to parse job_status." });
                    }

                    // Remove the most recent status (first element)
                    currentJobStatus.RemoveAt(0);

                    // Serialize the updated job_status back to JSON
                    string updatedJobStatusJson = JsonConvert.SerializeObject(currentJobStatus);

                    // Update the database: remove provider_id and update job_status
                    string updateQuery = "UPDATE Jobs SET provider_id = NULL, job_status = @job_status WHERE job_id = @jobId";

                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@job_status", updatedJobStatusJson);
                        updateCommand.Parameters.AddWithValue("@jobId", jobId);

                        int rowsAffected = updateCommand.ExecuteNonQuery();

                        if (rowsAffected == 0)
                        {
                            return NotFound(new { Message = $"Job with ID {jobId} not found." });
                        }
                    }

                    return Ok(new { Message = "Job successfully canceled.", UpdatedStatus = currentJobStatus });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // Endpoint to complete a job by adding after_photos
        [HttpPut("complete")]
        [SwaggerOperation(Summary = "Provider marks a job as completed", Description = "Allows a provider to mark a job as completed. Attaches the after_photos taken by the provider to the job listing.")]
        public async Task<IActionResult> CompleteJob([FromBody] JobRequest request)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Check if the after_photos is already set. This means the job is already completed
                    string checkQuery = "SELECT after_photos FROM Jobs WHERE job_id = @jobId";
                    object result;

                    using (var checkCommand = new MySqlCommand(checkQuery, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@jobId", request.job_id);
                        result = checkCommand.ExecuteScalar();
                    }

                    if (result != null && result != DBNull.Value)
                    {
                        return BadRequest(new { Message = "This job has already been completed." });
                    }

                    // Update the after_photos with the provided URLs
                    string updatedAfterPhotosJson = JsonConvert.SerializeObject(request.after_photos);

                    string updateQuery = "UPDATE Jobs SET after_photos = @after_photos WHERE job_id = @jobId";

                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@after_photos", updatedAfterPhotosJson);
                        updateCommand.Parameters.AddWithValue("@jobId", request.job_id);

                        int rowsAffected = updateCommand.ExecuteNonQuery();

                        if (rowsAffected == 0)
                        {
                            return NotFound(new { Message = $"Job with ID {request.job_id} not found." });
                        }
                    }

                    return Ok(new { Message = "Job completed successfully", UpdatedAfterPhotos = request.after_photos });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

        // API endpoint for updating a job when the customer leaves feedback on it. Takes an integer rating and optional
        // text feedback input named feedback
        [HttpPut("feedback")]
        [SwaggerOperation(Summary = "Customer leaves feedback on a job", Description = "This endpoint allows customers to leave feedback on a job. They can provide a 1-5 integer rating and optional text feedback, which will be added to the job listing.")]
        public IActionResult SubmitFeedback([FromBody] JobRequest request)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    // Check if feedback already exists
                    string checkQuery = "SELECT feedback FROM Jobs WHERE job_id = @jobId";
                    using (var checkCommand = new MySqlCommand(checkQuery, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@jobId", request.job_id);
                        var existingFeedback = checkCommand.ExecuteScalar()?.ToString();

                        if (!string.IsNullOrEmpty(existingFeedback))
                        {
                            return BadRequest(new { Message = $"Feedback for Job ID {request.job_id} has already been submitted." });
                        }
                    }

                    // Initialize an HTML/XSS sanitizer to sanitize custom user inputs
                    var sanitizer = new HtmlSanitizer();

                    // Update the feedback field in the Jobs table
                    string updateQuery = "UPDATE Jobs SET feedback = @feedback WHERE job_id = @jobId";

                    using (var updateCommand = new MySqlCommand(updateQuery, connection))
                    {
                        updateCommand.Parameters.AddWithValue("@feedback", WebUtility.HtmlDecode(sanitizer.Sanitize(request.feedback)));
                        updateCommand.Parameters.AddWithValue("@jobId", request.job_id);

                        int rowsAffected = updateCommand.ExecuteNonQuery();

                        if (rowsAffected == 0)
                        {
                            return NotFound(new { Message = $"Job with ID {request.job_id} not found." });
                        }
                    }

                    return Ok(new { Message = "Feedback submitted successfully", Feedback = request.feedback });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { Message = $"Internal server error: {ex.Message}" });
                }
            }
        }

    }
}