import { listCategories, listTags } from "../db/marketplace";
import type { Database } from "../db";

export function listThemeTags(db: Database) {
    return listTags(db);
}

export function listThemeCategories(db: Database) {
    return listCategories(db);
}
