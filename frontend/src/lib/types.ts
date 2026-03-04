export interface Theme {
	id: string;
	ownerId: string;
	name: string;
	description: string;
	images: string[];
	coverImage?: string;
	settings: any;
	customStyleshift?: any[];
	downloads: number;
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
