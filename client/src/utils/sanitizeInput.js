// This function uses DOMPurify to sanitize any custom user input for HTML/XSS attacks on the front-end

import createDOMPurify from "isomorphic-dompurify";

const DOMPurify = createDOMPurify();

const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input);
};

export default sanitizeInput;