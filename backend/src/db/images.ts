import { eq } from 'drizzle-orm';
import { themes } from './schema';
import type { Database } from './index';

export async function userOwnsImage(db: Database, userId: string, imageUrl: string): Promise<boolean> {
	const userThemes = await db
		.select({ images: themes.images, coverImage: themes.coverImage })
		.from(themes)
		.where(eq(themes.ownerId, userId))
		.all();

	return userThemes.some(theme => {
		const imagesArray = (theme.images || []) as string[];
		return imagesArray.includes(imageUrl) || theme.coverImage === imageUrl;
	});
}
