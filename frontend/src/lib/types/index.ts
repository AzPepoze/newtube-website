export interface Theme {
    themeId: string;
    ownerId: string;
    themeName: string;
    description: string;
    images: string[];
    coverImage?: string;
    settings: any;
    downloads: number;
    /** Marketplace metadata is optional while older API deployments are active. */
    category?: string | null;
    tags?: string[];
    rating?: number | null;
    ratingCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
    createdAt?: string;
}
