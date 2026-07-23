import type { Database } from "../db";
import {
    deleteOwnedImage,
    MAX_IMAGE_FILE_SIZE,
    uploadFileToR2,
} from "../services/images";
import type { ResponseStatus } from "../types/http";

type ImageControllerContext = {
    db: Database;
    env: Env;
    request: Request;
    set: ResponseStatus;
    userId?: string;
    body: unknown;
};

export const imageController = {
    async upload({ userId, request, set, env }: ImageControllerContext) {
        const { success } = await env.UPLOAD_RATE_LIMITER.limit({
            key: userId!,
        });
        if (!success) {
            set.status = 429;
            return {
                error: "Rate limit exceeded",
                message: "Too many uploads. Try again later.",
            };
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        const ALLOWED_MIMES = [
            "image/webp",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
        ];
        if (!file || !ALLOWED_MIMES.includes(file.type.toLowerCase())) {
            set.status = 400;
            return {
                error: "Invalid file",
                message: "Unsupported file format. Allowed formats: WebP, PNG, JPEG, GIF.",
            };
        }

        if (file.size > MAX_IMAGE_FILE_SIZE) {
            set.status = 413;
            return { error: "File too large", message: "Maximum size is 5MB." };
        }

        return { url: await uploadFileToR2(env, file) };
    },

    async remove({ userId, body, set, env, db }: ImageControllerContext) {
        const { url } = body as { url: string };
        if (!url) {
            set.status = 400;
            return { error: "Invalid request", message: "URL is required" };
        }

        const deletionOutcome = await deleteOwnedImage(db, env, userId!, url);
        if (deletionOutcome.status === "not-owned") {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Image not found in your themes",
            };
        }

        return { success: true };
    },
};
