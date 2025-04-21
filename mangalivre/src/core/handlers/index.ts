import { HttpError } from "@/core/errors";

export function handleError(error: unknown): Response {
    if (error instanceof HttpError) {
        return new Response(JSON.stringify({
            status_code: error.statusCode,
            detail: error.message
        }), {
            status: error.statusCode,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    console.error("Unexpected error:", error);

    return new Response(JSON.stringify({
        status_code: 500,
        detail: "Internal Server Error"
    }), {
        status: 500,
        headers: {
            "Content-Type": "application/json"
        }
    });
}