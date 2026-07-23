import { deleteImageFromR2, uploadImageToR2 } from "./images";
import type { ThemeInput } from "./themes";

export async function processPendingThemeImages(
    env: Env,
    themeInput: ThemeInput,
): Promise<{ uploadedUrls: string[]; finalCoverImage: string | undefined }> {
    const uploadedUrls: string[] = [];
    if (themeInput.pendingImages && Array.isArray(themeInput.pendingImages)) {
        for (const image of themeInput.pendingImages) {
            try {
                const url = await uploadImageToR2(
                    env,
                    image.data,
                    image.mimeType,
                );
                uploadedUrls.push(url);
            } catch (error) {
                console.error("Error uploading theme image:", error);
            }
        }
    }

    let finalCoverImage = themeInput.coverImage;
    if (themeInput.pendingCoverImage) {
        try {
            finalCoverImage = await uploadImageToR2(
                env,
                themeInput.pendingCoverImage.data,
                themeInput.pendingCoverImage.mimeType,
            );
        } catch (error) {
            console.error("Error uploading cover image:", error);
        }
    }

    return { uploadedUrls, finalCoverImage };
}

export async function cleanupRemovedThemeImages(
    env: Env,
    existingTheme: { coverImage?: string | null; images?: string[] | null },
    newCoverImage?: string,
    newImages?: string[],
) {
    const r2Prefix = "https://pub-";

    if (
        existingTheme.coverImage &&
        existingTheme.coverImage.includes(r2Prefix)
    ) {
        if (
            (newCoverImage !== undefined &&
                existingTheme.coverImage !== newCoverImage) ||
            newCoverImage === ""
        ) {
            await deleteImageFromR2(env, existingTheme.coverImage);
        }
    }

    if (newImages && existingTheme.images) {
        for (const imageUrl of existingTheme.images) {
            if (!newImages.includes(imageUrl) && imageUrl.includes(r2Prefix)) {
                await deleteImageFromR2(env, imageUrl);
            }
        }
    }
}
