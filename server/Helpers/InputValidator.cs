using inapinch.Models;

public static class InputValidator
{
    // The main praent validation function that checks the entire job request. This will call child functions that
    // individually validate each format a value should be in
    public static List<string> ValidateJobRequest(JobRequest request)
    {
        List<string> errors = new List<string>();

        // Call individual validation functions for each field

        if (!ValidateJobType(request.job_type))
            errors.Add("Invalid job type.");

        if (!ValidateJobDetails(request.job_details))
            errors.Add("Invalid job details. The job details must contain valid values.");

        if (!ValidateCustomInstructions(request.custom_instructions))
            errors.Add("Custom instructions are too long or invalid.");

        if (!ValidateScheduledType(request.scheduled_type))
            errors.Add("Invalid scheduled type. It must be either 'ASAP' or 'Scheduled'.");

        if (!ValidateScheduledTime(request.scheduled_time))
            errors.Add("Invalid scheduled time format. It should contain two valid dates separated by a pipe.");

        if (!ValidateSize(request.size))
            errors.Add("Invalid size. It must be 'Small', 'Medium', or 'Large'.");

        if (!ValidateFeedback(request.feedback))
            errors.Add("Invalid feedback. It must be in the format 'rating|feedback message'.");

        if (!ValidateDeliveryCoords(request.delivery_coords))
            errors.Add("Invalid delivery coordinates. Latitude must be between -90 and 90, and longitude must be between -180 and 180.");

        return errors;
    }

    // Validates job_type
    private static bool ValidateJobType(string? jobType)
    {
        string[] allowedTypes = { "Lawn Care", "Snow Removal" };
        return jobType != null && allowedTypes.Contains(jobType);
    }

    // Validates job_details
    private static bool ValidateJobDetails(List<string>? jobDetails)
    {
        if (jobDetails == null || jobDetails.Count == 0)
            return false; // Must have at least one valid entry

        string[] allowedValues =
        {
            "Front Only", "Back Only", "Front & Back", "None",
            "Driveway", "Sidewalks", "Front Porch", "Back Porch"
        };

        foreach (string detail in jobDetails)
        {
            if (string.IsNullOrWhiteSpace(detail))
                return false; // No empty or null values allowed

            if (!allowedValues.Contains(detail) &&
                !detail.StartsWith("Custom Instructions: ") &&
                !detail.StartsWith("Edging: "))
            {
                return false; // Invalid entry
            }
        }

        return true; // All entries are valid
    }

    // Validates custom_instructions
    private static bool ValidateCustomInstructions(string? customInstructions)
    {
        return string.IsNullOrEmpty(customInstructions) || customInstructions.Length <= 500;
    }

    // Validates job_type
    private static bool ValidateScheduledType(string? scheduledType)
    {
        // List of allowed values for scheduled_type
        string[] allowedTypes = { "ASAP", "Scheduled" };

        // Check if the scheduledType is not null and is one of the allowed types
        return scheduledType != null && allowedTypes.Contains(scheduledType);
    }

    // Validates scheduled_time
    private static bool ValidateScheduledTime(string? scheduledTime)
    {
        if (string.IsNullOrEmpty(scheduledTime))
        {
            // Valid if empty or null
            return true;
        }

        // Split the scheduledTime by the '|'
        string[] times = scheduledTime.Split('|');

        // Check if there are exactly two dates
        if (times.Length != 2)
        {
            return false;
        }

        // Define the expected date format
        string dateFormat = "M/d/yy h tt";

        // Try to parse both dates using the provided format
        bool isFirstValidDate = DateTime.TryParseExact(times[0], dateFormat, null, System.Globalization.DateTimeStyles.None, out _);
        bool isSecondValidDate = DateTime.TryParseExact(times[1], dateFormat, null, System.Globalization.DateTimeStyles.None, out _);

        // Return true if both dates are valid
        return isFirstValidDate && isSecondValidDate;
    }

    // Validates size
    private static bool ValidateSize(string? size)
    {
        // Define the allowed values for size
        string[] allowedSizes = { "Small", "Medium", "Large" };

        // Check if the size is not null and is contained in the allowed values
        return size != null && allowedSizes.Contains(size);
    }

    // Validates feedback
    private static bool ValidateFeedback(string? feedback)
    {
        // If feedback is null or empty, it's considered valid
        if (string.IsNullOrEmpty(feedback))
            return true;

        // Split the feedback into rating and feedback message parts using the '|'
        string[] feedbackParts = feedback.Split('|');

        // Ensure there are exactly two parts: rating and feedback message
        if (feedbackParts.Length != 2)
            return false;

        // Validate the rating part (must be an int between 1 and 5)
        if (!int.TryParse(feedbackParts[0], out int rating) || rating < 1 || rating > 5)
            return false;

        // Validate the feedback message part (it can be any custom text)
        string feedbackMessage = feedbackParts[1].Trim();
        if (string.IsNullOrWhiteSpace(feedbackMessage))
            return false;  // Ensure feedback message is not empty or just whitespace

        return true;  // If both parts are valid, return true
    }

    // Validates delivery_coords
    private static bool ValidateDeliveryCoords(Dictionary<string, double>? deliveryCoords)
    {
        // Check if the deliveryCoords dictionary is null or empty
        if (deliveryCoords == null || deliveryCoords.Count != 2)
            return false;

        // Check for required keys ('lat' and 'lon')
        if (!deliveryCoords.ContainsKey("lat") || !deliveryCoords.ContainsKey("lon"))
            return false;

        // Check if 'lat' and 'lon' are valid numbers within the expected ranges
        double lat = deliveryCoords["lat"];
        double lon = deliveryCoords["lon"];

        if (lat < -90 || lat > 90)
            return false; // Latitude must be between -90 and 90 degrees

        if (lon < -180 || lon > 180)
            return false; // Longitude must be between -180 and 180 degrees

        return true; // Valid coordinates
    }

}