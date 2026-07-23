import type { Database } from "../db";
import type { ResponseStatus } from "../types/http";
import {
    listThemeCategories,
    listThemeTags,
} from "../services/marketplace";

export type MarketplaceContext = {
    db: Database;
    userId?: string;
    set: ResponseStatus;
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: unknown;
};

export const marketplaceController = {
    listTags: () => listThemeTags(),
    listCategories: () => listThemeCategories(),
};
