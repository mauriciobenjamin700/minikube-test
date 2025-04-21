export class HttpError extends Error {
    public statusCode: number;

    constructor(statusCode: number, detail: string) {
        super(detail);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends HttpError {
    constructor(detail = "Bad Request") {
        super(400, detail);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(detail = "Unauthorized") {
        super(401, detail);
    }
}

export class ForbiddenError extends HttpError {
    constructor(detail = "Forbidden") {
        super(403, detail);
    }
}

export class NotFoundError extends HttpError {
    constructor(detail = "Not Found") {
        super(404, detail);
    }
}

export class ConflictError extends HttpError {
    constructor(detail = "Conflict") {
        super(409, detail);
    }
}

export class UnprocessableEntityError extends HttpError {
    constructor(detail = "Unprocessable Entity") {
        super(422, detail);
    }
}