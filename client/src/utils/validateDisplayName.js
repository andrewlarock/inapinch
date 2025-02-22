// This functions validates if a display name is a valid first and last name

const validateDisplayName = (firstName, lastName) => {
    // Helper regex for alphabetic characters only
    const nameRegex = /^[A-Za-z]+$/;

    if (!firstName || !lastName) {
        return "Both first and last names are required.";
    }

    if (firstName.length > 13 || lastName.length > 13) {
        return "First and last names must not exceed 13 characters.";
    }

    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        return "Names must contain only alphabetic characters with no spaces.";
    }

    return null;
};

export default validateDisplayName;