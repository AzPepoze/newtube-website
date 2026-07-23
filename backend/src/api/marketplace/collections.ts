import { Elysia } from "elysia";
import {
    addThemeToCollection,
    createCollection,
    deleteCollection,
    getCollectionForOwner,
    listCollectionThemes,
    listCollectionsByUser,
    removeThemeFromCollection,
    updateCollection,
} from "../../db/marketplace";
import { getThemeForViewer } from "../../db/themes";
import { authGuard } from "../../plugins/auth-guard";
import { contextPlugin } from "../../plugins/context";
import { validateText, validateUuid } from "../../utils/validation";

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export const marketplaceCollectionsRoute = new Elysia()
    .use(contextPlugin)
    .use(authGuard)
    .get("/collections", ({ userId, db }) => listCollectionsByUser(db, userId!))
    .post("/collections", async ({ body, userId, db, set }) => {
        const data = body as any;
        const nameValidation = validateText(data?.name, "Collection name", {
            min: 1,
            max: 80,
            required: true,
        });
        const descriptionValidation = validateText(
            data?.description,
            "Description",
            { max: 500 },
        );
        if (!nameValidation.valid || !descriptionValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: !nameValidation.valid
                    ? invalidMessage(nameValidation)
                    : invalidMessage(descriptionValidation),
            };
        }
        try {
            const collection = await createCollection(db, {
                userId: userId!,
                name: data.name.trim(),
                description: data.description?.trim() || undefined,
            });
            set.status = 201;
            return collection;
        } catch (error) {
            set.status = 409;
            return {
                error: "Collection already exists",
                message: "Collection names must be unique",
            };
        }
    })
    .get("/collections/:id", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        if (!idValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection ID",
                message: idValidation.message,
            };
        }
        const collection = await getCollectionForOwner(db, params.id, userId!);
        if (!collection) {
            set.status = 404;
            return { error: "Collection not found" };
        }
        return {
            ...collection,
            items: await listCollectionThemes(db, params.id, {
                publicOnly: false,
            }),
        };
    })
    .put("/collections/:id", async ({ params, body, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        const data = body as any;
        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            (data.name === undefined && data.description === undefined)
        ) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: "Provide name or description",
            };
        }
        const nameValidation =
            data.name === undefined
                ? { valid: true as const }
                : validateText(data.name, "Collection name", {
                      min: 1,
                      max: 80,
                      required: true,
                  });
        const descriptionValidation =
            data.description === undefined || data.description === null
                ? { valid: true as const }
                : validateText(data.description, "Description", { max: 500 });
        if (
            !idValidation.valid ||
            !nameValidation.valid ||
            !descriptionValidation.valid
        ) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : !nameValidation.valid
                      ? invalidMessage(nameValidation)
                      : invalidMessage(descriptionValidation),
            };
        }
        try {
            const result = await updateCollection(db, params.id, userId!, {
                ...(data.name === undefined ? {} : { name: data.name.trim() }),
                ...(data.description === undefined
                    ? {}
                    : {
                          description:
                              data.description === null
                                  ? null
                                  : data.description.trim() || null,
                      }),
            });
            if (result.meta.changes === 0) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            set.status = 204;
        } catch {
            set.status = 409;
            return {
                error: "Collection already exists",
                message: "Collection names must be unique",
            };
        }
    })
    .delete("/collections/:id", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        if (!idValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection ID",
                message: idValidation.message,
            };
        }
        const result = await deleteCollection(db, params.id, userId!);
        if (result.meta.changes === 0) {
            set.status = 404;
            return { error: "Collection not found" };
        }
        set.status = 204;
    })
    .post(
        "/collections/:id/items",
        async ({ params, body, userId, db, set }) => {
            const idValidation = validateUuid(params.id, "collection ID");
            const data = body as any;
            const themeValidation = validateUuid(data?.themeId, "theme ID");
            if (!idValidation.valid || !themeValidation.valid) {
                set.status = 400;
                return {
                    error: "Invalid collection item",
                    message: !idValidation.valid
                        ? invalidMessage(idValidation)
                        : invalidMessage(themeValidation),
                };
            }
            const collection = await getCollectionForOwner(
                db,
                params.id,
                userId!,
            );
            if (!collection) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            const theme = await getThemeForViewer(db, data.themeId);
            if (!theme) {
                set.status = 404;
                return { error: "Public theme not found" };
            }
            const item = await addThemeToCollection(
                db,
                params.id,
                data.themeId,
            );
            set.status = 201;
            return item;
        },
    )
    .delete(
        "/collections/:id/items/:themeId",
        async ({ params, userId, db, set }) => {
            const idValidation = validateUuid(params.id, "collection ID");
            const themeValidation = validateUuid(params.themeId, "theme ID");
            if (!idValidation.valid || !themeValidation.valid) {
                set.status = 400;
                return {
                    error: "Invalid collection item",
                    message: !idValidation.valid
                        ? invalidMessage(idValidation)
                        : invalidMessage(themeValidation),
                };
            }
            const collection = await getCollectionForOwner(
                db,
                params.id,
                userId!,
            );
            if (!collection) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            const result = await removeThemeFromCollection(
                db,
                params.id,
                params.themeId,
            );
            if (result.meta.changes === 0) {
                set.status = 404;
                return { error: "Collection item not found" };
            }
            set.status = 204;
        },
    );
