# Database Schema

## Table of Contents
1. [`MySQL Database`]
   - [`Jobs Table Overview`]
   - [`Structured Data Columns`]
2. [`Firestore Database`]
   - [`Collections Overview`]
   - [`Structured Records`]

-------------------------------------------------------------------------------------------

## MySQL Database
This section provides an overview of the **Jobs Table**, including:
1. **Table Overview** - Columns and their descriptions.
2. **Structured Data Columns** - Explanation of formatted strings and JSON structures.

-------------------------------------------------------------------------------------------

## Table Overview
The `Jobs` table stores information about each posted landscaping job.

| Column              | Type         | Description                                        |
|---------------------|--------------|----------------------------------------------------|
| job_id              | VARCHAR(50)  | Unique job identifier                              |
| customer_id         | TEXT         | Firebase User ID of customer                       |
| provider_id         | TEXT         | Firebase User ID of provider that accepted the job |
| job_status          | JSON         | Array of job status updates                        |
| job_type            | TEXT         | Type of landscaping service                        |
| job_details         | JSON         | Job-specific details                               |
| custom_instructions | TEXT         | Special instructions from customer                 |
| delivery_address    | TEXT         | Address where service is requested                 |
| delivery_coords     | JSON         | Geolocation coordinates                            |
| scheduled_type      | TEXT         | If the user wants ASAP or scheduled service        |
| scheduled_time      | TEXT         | Scheduled date/time for the job                    |
| size                | TEXT         | General size of the area to be serviced            |
| before_photos       | JSON         | List of S3 URLs of before photos                   |
| after_photos        | JSON         | List of S3 URLs of after photos                    |
| feedback            | TEXT         | Customer feedback for provider                     |

## Structured Data Columns
Certain columns in this MySQL table store structured data as formatted strings or JSON arrays. Below are explanations of these formats and how their values should be interpreted.

- `job_status`
Definition: Array of job status updates. The most recent job update is always the first element in the array.

Example:
[
  "Completed: 2025-02-18 20:03:45",
  "Accepted: 2025-02-18 20:01:14",
  "Pending: 2025-02-18 20:00:23"
]

Possible Statuses:
  - "Pending: <timestamp>"  -> Job is created but not yet accepted.
  - "Accepted: <timestamp>" -> A provider has accepted the job.
  - "Completed: <timestamp>" -> Work is finished.

- `job_details`
Definition: A list specifying job details of either a Lawn Care or Snow Removal job.

Examples:
["Front & Back"], ["Driveway", "Front Porch"], ["Front Only", "Edging: Please edge around the flower beds."]

Possible Entries for a Lawn Care Job:
- "Front & Back"
- "Front Only"
- "Back Only"
- "Edging: <custom_edging_instructions_left_by_user>"

Possible Entries for a Snow Removal Job:
- "Driveway"
- "Sidewalks"
- "Front Porch"
- "Back Porch"

- `schedule_type`
Definition: Specifies if the user wants their service ASAP or within a scheduled window.

Examples:
'ASAP' or 'Scheduled'

- `scheduled_time`
-------------------------------------
Definition: A job scheduling window containing two dates separated by '|'.

Format:
  <Opening Window>|<Closing Window>

Example:
  '2/19/25 8 PM|2/21/25 10 PM'

Breakdown:
  - First Date (2/19/25 8 PM)  -> The earliest time the job can start.
  - Second Date (2/21/25 10 PM) -> The latest time the job must be completed.

NOTE: If scheduled_type is 'ASAP', this field will be NULL.

- `delivery_address` and `delivery_coords`
-------------------------------------
- delivery_address: '123 Main St, New York, NY, USA'
  * Human-readable address for job location.

- delivery_coords: {"lat": 40.7128, "lon": -74.0060}
  * Latitude and longitude for job location (useful for map integration).

- `before_photos` and `after_photos`
-------------------------------------
Definition: URLs pointing to before & after job images stored in AWS S3.

Example:
[
  "s3url1.com",
  "s3url2.com"
]

Possible Entries:
  - before_photos -> Photos before job completion submitted by the user.
  - after_photos  -> Photos after job completion submitted by the provider.

- `feedback`
-------------------------------------
Definition: A customer rating (1-5) followed by optional text feedback, separated by '|'. This is left by the customer for the provider that carried out their service.

Format:
  <Rating>|<Feedback>

Example:
  '5|Incredible job! The lawn looks amazing!'

Breakdown:
  - First Value (5)  -> A rating from 1 (poor) to 5 (excellent).
  - Second Value ("Incredible job!")  -> Optional text feedback from the customer.

NOTE: If no feedback is given, this field may be empty ('').


----------------------------------------------------------------------------------------------------------

## Firestore Database
This section covers:
1. **Collection Overview** - How users (customers/providers) are stored.
2. **Structured Values** - Breakdown of Firestore documents for providers.

----------------------------------------------------------------------------------------------------------

## Collection Overview
Firestore is used to store user profiles which differ between regular users (customers) and service providers. Below are detailed examples of how each type of user is structured.

- `Example Customer Entry`

A customer is a regular user who can request landscaping services. Their Firestore document contains basic personal details and home location information.

| Field        | Type   | Example Value                     | Description                                |
|--------------|--------|-----------------------------------|--------------------------------------------|
| displayName  | string | 'James Doe'                       | Full name of the customer.                 |
| email        | string | 'jamesdoe@gmail.com'              | Email address of the customer.             |
| homeAddress  | string | '123 Main St, New York, NY, USA'  | Home address where services are requested. |
| homeCoords   | map    | {"lat": 40.7128, "lon": -74.0060} | Geographic coordinates of the home.        |

- `Example Provider Entry`

A provider is a user who offers landscaping services. Their Firestore document contains more fields than a customer, including business details, service areas, and performance ratings.

| Field        | Type   | Example Value                     | Description                                |
|--------------|--------|-----------------------------------|--------------------------------------------|
| displayName  | string | 'James Doe'                       | Full name of the customer.                 |
| email        | string | 'jamesdoe@gmail.com'              | Email address of the customer.             |
| homeAddress  | string | '123 Main St, New York, NY, USA'  | Home address where services are requested. |
| homeCoords   | map    | {"lat": 40.7128, "lon": -74.0060} | Geographic coordinates of the home.        |
| isProvider   | string | 'Yes'                             | Confirms that the user is a provider.      |
| providerDetails | map | {... (see below)}                 | Contains all provider-specific information |

Breakdown of providerDetails (Nested Fields)

| Field             | Type   | Description                                         |
|-------------------|--------|-----------------------------------------------------|
| equipmentPhotos   | array  | List of provider's equipment photos (S3 URLs).      |
| feedback          | array  | List of reviews left by customers.                  |
| providedServices  | string | Indicates the types of services offered.            |
| providerAddress   | string | Business address of the provider.                   |
| providerCoords    | map    | Geographic coordinates of the provider.             |
| providerName      | string | Name used for service listings.                     |
| providerSelfie    | string | Photo of the provider (S3 URL).                     |
| ratingCount       | number | Total number of ratings received.                   |
| serviceRange      | number | Distance (in miles) of the providers service range. |
| servicesCompleted | number | Total number of jobs completed.                     |
| totalRating       | number | Sum of all ratings received.                        |
| user              | string | User ID of the provider.                            |

## Structured Values inside providerDetails
Certain values inside providerDetails store structured data as formatted strings or objects. Below are explanations of these formats and how their values should be interpreted.

- `feedback`
Definition: List of reviews left by individual customers. Each review contains a rating (1-5), an optional text review, the services the completed, and the date they completed it on, each separated by a '|'. This is so we can store each review and pertitient details about said review on the provider's profile page

Format: <Rating>|<Review_Text>|<Services_Completed>|<Date>

Examples:
- "5|Joe did a great job!|Front & Back Lawn Trimming|12/18"
- "4|Excellent, but took longer than expected|Driveway, Sidewalks Snow Removal|1/10"