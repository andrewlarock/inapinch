import { auth } from "../auth/firebase";

// This function validates a users Firebase token and is called before every API request. Once validated,
// the token is stored in memory and refreshed every 55 minutes (firebase id tokens are stored by default for
// an hour) so we dont have unneccessary backend calls

let cachedToken = null;
let lastTokenRefreshTime = 0;

const backendURL = "https://inapinchapi.com/";

const validateToken = async () => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User is not signed in.");
    }

    const currentTime = Date.now();
    const tokenValidDuration = 55 * 60 * 1000; // Refresh token if older than 55 minutes

    // Use cached token if its still valid
    if (cachedToken && currentTime - lastTokenRefreshTime < tokenValidDuration) {
        return cachedToken;
    }

    try {
        // Get a new valid token from Firebase
        const token = await user.getIdToken(true); // Force refresh if its needed

        // Send the token to the backend for validation only if needed
        const response = await fetch(`${backendURL}auth/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.Message || "Token validation failed.");
        }

        // Cache the validated token
        cachedToken = token;
        lastTokenRefreshTime = Date.now();

        return token;
    } catch (error) {
        console.error("Token Validation Error:", error.message);
        throw error;
    }
};

// Makes an API request with token validation. This is for centralization of all API requests

const apiRequest = async (endpoint, method = "GET", body = null) => {
    try {
        // Validate the users token
        const token = await validateToken();

        // Configure the request options
        const options = {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        };

        // Serialize the body to JSON
        if (body) {
            options.body = JSON.stringify(body);
        }

        // Make the API request
        const response = await fetch(`${backendURL}${endpoint}`, options);

        // Check if the response status is 429 (rate-limited)
        if (response.status === 429) {
            window.location.href = '/';
            alert('Rate limit exceeded. Try again in 60 seconds.');
            throw new Error('Rate limit exceeded. Try again in 60 seconds.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response data:", errorData);
            throw new Error(errorData.Message || "An error occurred while processing the request.");
        }

        // Check if the response is JSON or plaintext
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error("API Request Error:", error.message);
        return error.message; 
    }
};

export { validateToken, apiRequest };