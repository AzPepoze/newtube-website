import type { Database } from "../db";
import type { ResponseStatus } from "../types/http";
import { listThemeTags } from "../services/marketplace";

export type MarketplaceControllerContext = {
    db: Database;
    userId?: string;
    set: ResponseStatus;
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: unknown;
};

export const marketplaceController = {
    listTags: ({ db }: MarketplaceControllerContext) => listThemeTags(db),
};
