import { getSponsors } from "../services/sponsors";
import type { ResponseStatus } from "../types/http";

type SponsorsControllerContext = {
    env: Env;
    set: ResponseStatus;
};

export const sponsorsController = {
    async list({ env, set }: SponsorsControllerContext) {
        const result = await getSponsors(env);
        if (result.status === "failed") {
            set.status = 500;
            return { error: "Failed to fetch sponsors" };
        }

        return result.sponsors;
    },
};
