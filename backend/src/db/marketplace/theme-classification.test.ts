import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { THEME_CATEGORIES, THEME_TAGS } from "../../constants/marketplace";
import { createDb } from "../index";
import { categories, tags, themeCategories, themeTags } from "../schema";
import {
    setThemeTagNames,
    syncThemeTagsAndCategories,
} from "./theme-classification";

const db = createDb(env.DB);

describe("syncThemeTagsAndCategories", () => {
    beforeEach(() =>
        env.DB.exec(
            "DELETE FROM ThemeTags; DELETE FROM ThemeCategories; DELETE FROM Themes; DELETE FROM Tags; DELETE FROM Categories; DELETE FROM Users;",
        ),
    );

    it("inserts all code-defined tags and categories", async () => {
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(tags).all()).toHaveLength(12);
        expect(await db.select().from(categories).all()).toHaveLength(8);
    });

    it("unlinks themes before deleting an undefined category", async () => {
        await env.DB.exec(
            "INSERT INTO Categories (id, slug, name) VALUES ('removed-category', 'removed', 'Removed');" +
                "INSERT INTO Users (id, email, name) VALUES ('owner-1', 'owner-1@example.test', 'Owner');" +
                "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-1', 'owner-1', 'Theme', '{}', 1);" +
                "INSERT INTO ThemeCategories (theme_id, category_id) VALUES ('theme-1', 'removed-category');",
        );
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(themeCategories).all()).toEqual([]);
        expect(await db.select().from(categories).all()).toHaveLength(8);
    });

    it("deletes an undefined tag and cascades its theme links", async () => {
        await env.DB.exec(
            "INSERT INTO Tags (id, slug, name) VALUES ('removed-tag', 'removed', 'Removed');" +
                "INSERT INTO Users (id, email, name) VALUES ('owner-2', 'owner-2@example.test', 'Owner');" +
                "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-2', 'owner-2', 'Theme', '{}', 1);" +
                "INSERT INTO ThemeTags (theme_id, tag_id) VALUES ('theme-2', 'removed-tag');",
        );
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(themeTags).all()).toEqual([]);
        expect(await db.select().from(tags).all()).toHaveLength(12);
    });

    it("does not create a submitted tag absent from THEME_TAGS", async () => {
        await syncThemeTagsAndCategories(db);
        await env.DB.exec(
            "INSERT INTO Users (id, email, name) VALUES ('owner-3', 'owner-3@example.test', 'Owner');" +
                "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-3', 'owner-3', 'Theme', '{}', 1);",
        );
        await setThemeTagNames(db, "theme-3", ["not-defined-in-code"]);
        expect(await db.select().from(tags).all()).toHaveLength(12);
        expect(await db.select().from(themeTags).all()).toEqual([]);
    });

    it("finishes and clears tags when no tags are code-defined", async () => {
        await syncThemeTagsAndCategories(db);
        const definedTags = [...THEME_TAGS];
        const mutableTags =
            THEME_TAGS as unknown as (typeof THEME_TAGS)[number][];
        mutableTags.length = 0;

        try {
            await expect(
                syncThemeTagsAndCategories(db),
            ).resolves.toBeUndefined();
            expect(await db.select().from(tags).all()).toEqual([]);
        } finally {
            mutableTags.push(...definedTags);
        }
    });

    it("finishes and clears categories when no categories are code-defined", async () => {
        await syncThemeTagsAndCategories(db);
        const definedCategories = [...THEME_CATEGORIES];
        const mutableCategories =
            THEME_CATEGORIES as unknown as (typeof THEME_CATEGORIES)[number][];
        mutableCategories.length = 0;

        try {
            await expect(
                syncThemeTagsAndCategories(db),
            ).resolves.toBeUndefined();
            expect(await db.select().from(categories).all()).toEqual([]);
        } finally {
            mutableCategories.push(...definedCategories);
        }
    });
});
