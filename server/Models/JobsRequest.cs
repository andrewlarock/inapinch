// Request model for the JobsController

namespace inapinch.Models;

public class JobRequest
{
    public string? job_id { get; set; }
    public string? customer_id { get; set; }
    public List<string>? job_status { get; set; } = new List<string>();
    public string? job_type { get; set; }
    public List<string>? job_details { get; set; } = new List<string>();
    public string? custom_instructions { get; set; }
    public string? delivery_address { get; set; }
    public string? scheduled_type { get; set; }
    public string? scheduled_time { get; set; }
    public string? size { get; set; }
    public string? provider_id { get; set; }
    public List<string>? before_photos { get; set; } = new List<string>();
    public List<string>? after_photos { get; set; } = new List<string>();
    public string? feedback { get; set; }
    public Dictionary<string, double>? delivery_coords { get; set; }
}