import type { User } from './types';
import { PUBLIC_API_URL } from './constants';

export function getSessionId(): string {
	if (typeof document === 'undefined') return '';
	const match = document.cookie.match(/(?:^|;\s*)sessionId=([^;]*)/);
	return match ? decodeURIComponent(match[1]) : '';
}

export async function getCurrentUser(): Promise<User | null> {
	try {
		const response = await fetch(`${PUBLIC_API_URL}/users/me`, {
			credentials: 'include',
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export function clearSessionId() {
	document.cookie = 'sessionId=; Path=/; Max-Age=0';
}

export function requireAuth(customPath?: string): string {
	const sessionId = getSessionId();
	if (!sessionId && typeof window !== 'undefined') {
		const redirect = customPath || window.location.pathname + window.location.search;
		window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
	}
	return sessionId;
}

export const PROTECTED_ROUTES = ['/profile', '/themes/create', '/themes/edit'];

export function isProtectedRoute(path: string): boolean {
	return PROTECTED_ROUTES.some(prefix => path.startsWith(prefix));
}

export function handleAuthError() {
	clearSessionId();
	if (typeof window !== 'undefined') {
		if (isProtectedRoute(window.location.pathname)) {
			const redirect = window.location.pathname + window.location.search;
			window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
		} else {
			// On public pages, just refresh to update the UI (show login button)
			window.location.reload();
		}
	}
}
