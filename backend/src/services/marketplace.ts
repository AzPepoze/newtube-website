import { listTags } from "../db/marketplace";
import type { Database } from "../db";

export function listThemeTags(db: Database) {
    return listTags(db);
}
