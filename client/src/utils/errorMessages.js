const errorMessages = {
    "auth/email-already-in-use": "This email address is already in use. Please use a different email or log in.",
    "auth/invalid-email": "The email address you entered is not valid. Please enter a valid email.",
    "auth/operation-not-allowed": "Account creation is currently unavailable. Please contact support.",
    "auth/weak-password": "The password you entered is too weak. Please choose a stronger password with at least 6 characters.",
    "auth/missing-email": "Please enter an email address.",
    "auth/missing-password": "Please enter a password.",
    "auth/internal-error": "An unexpected error occurred. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/requires-recent-login": "Please log in again to proceed.",
    "auth/invalid-api-key": "There is a configuration error. Please contact support.",
    "auth/user-not-found": "No user found with this email. Please check your email or sign up.",
    "auth/wrong-password": "The password you entered is incorrect. Please try again.",
    "auth/invalid-credential": "Incorrect email or password. Please try again.",
    "auth/cancelled-popup-request": "Sign-in process was cancelled. Please try again.",
    "auth/popup-closed-by-user": "You closed the sign-in window. Please try again.",
    "auth/timeout": "The sign-in process timed out. Please try again.",
    "auth/unknown": "An unknown error occurred. Please try again later."
};

// Fallback error message for unknown codes
const getErrorMessage = (code) => errorMessages[code] || "An unknown error occurred. Please try again.";

export { getErrorMessage };