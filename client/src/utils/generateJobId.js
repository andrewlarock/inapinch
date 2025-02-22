export const generateJobId = () => {
    const chars = "0123456789";
    let randomString = Array.from({ length: 13 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `INP-${randomString}`;
};