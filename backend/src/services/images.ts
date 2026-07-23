import { userOwnsImage } from "../db/images";
import type { Database } from "../db";

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

/** Uploads a base64-encoded image used while a theme is being saved. */
export async function uploadImageToR2(
    env: Env,
    fileData: string,
    mimeType: string,
): Promise<string> {
    console.log("[uploadImageToR2] Starting upload...", {
        mimeType,
        dataLength: fileData?.length,
    });

    try {
        const base64Data = fileData.includes(",")
            ? fileData.split(",")[1]
            : fileData;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const extension = mimeType.split("/")[1] ?? "webp";
        const objectKey = `${crypto.randomUUID()}.${extension}`;

        console.log("[uploadImageToR2] Putting object to R2:", objectKey);
        const blob = new Blob([byteArray], { type: mimeType });
        await env.IMAGES.put(objectKey, blob.stream(), {
            httpMetadata: { contentType: mimeType },
        });

        const url = `${env.R2_PUBLIC_URL}/${objectKey}`;
        console.log("[uploadImageToR2] Upload successful:", url);
        return url;
    } catch (error) {
        console.error("[uploadImageToR2] Upload failed:", error);
        throw error;
    }
}

/** Uploads a browser File received through the image upload endpoint. */
export async function uploadFileToR2(env: Env, file: File): Promise<string> {
    const extension = file.type.split("/")[1] ?? "webp";
    const objectKey = `${crypto.randomUUID()}.${extension}`;

    await env.IMAGES.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
    });

    return `${env.R2_PUBLIC_URL}/${objectKey}`;
}

export async function deleteImageFromR2(env: Env, imageUrl: string): Promise<void> {
    try {
        const url = new URL(imageUrl);
        const objectKey = url.pathname.substring(1);
        await env.IMAGES.delete(objectKey);
    } catch (error) {
        console.error("Error deleting image from R2:", error);
    }
}

export async function deleteOwnedImage(
    db: Database,
    env: Env,
    userId: string,
    imageUrl: string,
) {
    if (!(await userOwnsImage(db, userId, imageUrl))) {
        return { status: "not-owned" as const };
    }

    await deleteImageFromR2(env, imageUrl);
    return { status: "deleted" as const };
}
