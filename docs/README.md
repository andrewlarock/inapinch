# In a Pinch - On-Demand Residential Landscaping Platform

## Overview
In a Pinch is a web application that connects users with local landscaping service providers. Users can request on-demand services such as lawn care or snow removal, while approved providers can accept and complete jobs.

## Tech Stack
- Frontend: React (deployed via Amazon S3)
- Backend: .NET Core (deployed via AWS Elastic Beanstalk and CloudFormation)
- Authentication: Firebase Authentication
- Database: MySQL (Jobs) & Firestore (User Data)
- Storage: AWS S3 (Photos)

## Features
- On-Demand Landscaping Services: Users can easily request services like lawn care or snow removal, while landscaping providers can apply to offer their services.
- Real-Time Job Updates: Both users and providers receive instant notifications about job status, ensuring smooth communication from start to finish.
- Provider Dashboard: Landscaping providers can manage available jobs, track current tasks, and update their profiles from a personalized dashboard.
- Provider and Customer Profiles: Secure profiles for both users and providers via Firebase authentication, making job tracking and communication seamless.
- Location Services: Integrated with Google Maps API, Places API, and Geocoding API to display job locations, directions, and distance calculations for efficient routing.
- Review & Rating System: Customers can leave ratings and reviews for the providers who completed their services, ensuring transparency between customers and providers.
- Advanced Security: Implemented security features like IP-based rate limiting and bot detection to protect against unauthorized usage.
