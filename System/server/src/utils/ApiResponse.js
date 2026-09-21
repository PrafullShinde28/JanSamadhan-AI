class ApiResponse {
    constructor(statusCode, data = null, message = "Success", meta = null) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }

    static success({
        statusCode = 200,
        message = "Success",
        data = null,
        meta = null,
    }) {
        return new ApiResponse(statusCode, data, message, meta);
    }
}

export default ApiResponse;