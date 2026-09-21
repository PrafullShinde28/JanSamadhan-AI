class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = "",
        metadata = {}
    ) {
        super(message);

        this.success = false;
        this.statusCode = statusCode;
        this.errors = errors;
        this.metadata = metadata;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;