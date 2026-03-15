import type { User } from './types';
import { PUBLIC_API_URL } from './constants';

export function getSessionId(): string {
	if (typeof window !== 'undefined') {
		const urlParams = new URL(window.location.href).searchParams;
		const urlSessionId = urlParams.get('sessionId');
		if (urlSessionId) return urlSessionId;
	}

	if (typeof document === 'undefined') return '';
	const match = document.cookie.match(/(?:^|;\s*)sessionId=([^;]*)/);
	if (match) return decodeURIComponent(match[1]);

	// If sessionId is httpOnly, we can't read it, but we can check for userId
	// which is set alongside sessionId on the same login event.
	const userMatch = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
	return userMatch ? decodeURIComponent(userMatch[1]) : '';
}

export function setSessionId(sessionId: string, userId?: string) {
	if (typeof document === 'undefined') return;
	const domain = window.location.hostname;
	const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
	const sameSite = isLocalhost ? 'Lax' : 'None';
	const secure = !isLocalhost;

	document.cookie = `sessionId=${encodeURIComponent(sessionId)}; Path=/; Max-Age=2592000; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
	if (userId) {
		document.cookie = `userId=${encodeURIComponent(userId)}; Path=/; Max-Age=2592000; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
	}
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
	document.cookie = 'userId=; Path=/; Max-Age=0';
}

export function isAuthenticated(): boolean {
	const sessionId = getSessionId();
	return !!sessionId;
}

export function requireAuth(customPath?: string): string {
	const sessionId = getSessionId();
	if (!sessionId && typeof window !== 'undefined') {
		const redirect = customPath || window.location.pathname + window.location.search;
		window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
		return '';
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
			window.location.reload();
		}
	}
}
