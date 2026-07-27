/**
 * Comprehensive HTTP response and API error parser.
 * Extracts meaningful error messages from JSON error payloads, HTTP status codes,
 * validation error arrays, rate-limiting headers, network failures, and text bodies.
 */

const HTTP_STATUS_MESSAGES: Record<number, string> = {
	400: "Bad request. Please check your input and try again.",
	401: "Authentication required. Please log in to continue.",
	403: "Access denied. You do not have permission to perform this action.",
	404: "The requested resource or theme was not found.",
	408: "Request timed out. Please try again.",
	409: "A resource conflict occurred. Please check your data.",
	413: "Payload too large. Please reduce the size of your upload.",
	422: "Validation error. Please check your input fields.",
	429: "Rate limit exceeded. Too many requests. Please wait a moment before trying again.",
	500: "Internal server error. Something went wrong on the server.",
	502: "Bad gateway. The backend service is temporarily unreachable.",
	503: "Service unavailable. The store backend is undergoing maintenance or overloaded.",
	504: "Gateway timeout. The server took too long to respond.",
};

export async function parseApiError(
	response: Response | Error | unknown,
	defaultFallback = "An unexpected error occurred. Please try again.",
): Promise<string> {
	if (!response) return defaultFallback;

	// 1. Handle JavaScript Error or Network Failure objects
	if (response instanceof Error) {
		if (response.name === "AbortError") return "Request was cancelled.";
		if (response.message.includes("Failed to fetch") || response.message.includes("NetworkError")) {
			return "Network error. Unable to connect to NewTube Store servers.";
		}
		return response.message || defaultFallback;
	}

	if (typeof response === "string") {
		return response.trim() || defaultFallback;
	}

	// 2. Handle HTTP Response objects
	if (typeof response === "object" && "status" in response) {
		const res = response as Response;
		let serverMessage: string | null = null;

		// Try cloning & reading JSON body for structured backend errors
		try {
			const clone = res.clone();
			const data = await clone.json();

			if (data && typeof data === "object") {
				// Handle array of validation errors e.g. [{ field: "name", message: "..." }]
				if (Array.isArray(data.errors) && data.errors.length > 0) {
					const errMsgs = data.errors
						.map((e: any) => (typeof e === "string" ? e : e.message || e.msg || e.detail))
						.filter(Boolean);
					if (errMsgs.length > 0) serverMessage = errMsgs.join(", ");
				} else if (Array.isArray(data.issues) && data.issues.length > 0) {
					const issueMsgs = data.issues
						.map((i: any) => (typeof i === "string" ? i : i.message || i.msg))
						.filter(Boolean);
					if (issueMsgs.length > 0) serverMessage = issueMsgs.join(", ");
				} else {
					// Check common error fields
					const raw = data.error || data.message || data.detail || data.msg || data.description || data.cause;
					if (typeof raw === "string" && raw.trim()) {
						serverMessage = raw.trim();
					} else if (typeof raw === "object" && raw !== null) {
						serverMessage = raw.message || raw.error || JSON.stringify(raw);
					}
				}
			}
		} catch {
			// If not JSON, try text body
			try {
				const clone = res.clone();
				const text = await clone.text();
				if (text && text.trim() && !text.includes("<!DOCTYPE") && !text.includes("<html") && text.length < 300) {
					serverMessage = text.trim();
				}
			} catch {
				// Ignore text parse errors
			}
		}

		// Check Retry-After header for 429 Rate Limit
		if (res.status === 429) {
			const retryAfter = res.headers?.get?.("Retry-After");
			if (retryAfter) {
				const seconds = parseInt(retryAfter, 10);
				if (!isNaN(seconds) && seconds > 0) {
					return `Rate limit exceeded. Please wait ${seconds} seconds before trying again.`;
				}
			}
			return serverMessage || HTTP_STATUS_MESSAGES[429];
		}

		if (serverMessage) {
			return serverMessage;
		}

		// Fallback to HTTP Status Map or Status Text
		if (HTTP_STATUS_MESSAGES[res.status]) {
			return HTTP_STATUS_MESSAGES[res.status];
		}

		if (res.statusText && res.statusText !== "OK") {
			return `Server Error (${res.status}): ${res.statusText}`;
		}

		return `Server Error (${res.status}).`;
	}

	return defaultFallback;
}
