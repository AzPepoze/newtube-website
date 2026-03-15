import { EXTENSION_EVENTS } from "$lib/constants";

export const extensionState = $state({
	isExtensionReady: false,
	installedThemeId: null as string | null
});

export function initializeExtensionListener() {
	if (typeof window === "undefined") return;
	
	window.addEventListener(EXTENSION_EVENTS.READY, () => {
		console.log("NewTube extension detected!");
		extensionState.isExtensionReady = true;
	});

	window.addEventListener(EXTENSION_EVENTS.INSTALL_STATUS, (event: Event) => {
		const customEvent = event as CustomEvent;
		if (customEvent.detail && customEvent.detail.themeId && customEvent.detail.isInstalled) {
			extensionState.installedThemeId = customEvent.detail.themeId;
		} else if (customEvent.detail && !customEvent.detail.isInstalled) {
			if (extensionState.installedThemeId === customEvent.detail.themeId) {
				extensionState.installedThemeId = null;
			}
		}
	});
}

export function dispatchThemeInstallation(themeId: string, themeName: string, targetDomains: string[]) {
	if (typeof window === "undefined") return;
	
	const event = new CustomEvent(EXTENSION_EVENTS.INSTALL, {
		detail: {
			themeId,
			themeName,
			targetDomains
		}
	});
	window.dispatchEvent(event);
	
	extensionState.installedThemeId = themeId;
}

export function dispatchThemeSave(themeId: string, themeName: string, targetDomain: string) {
	if (typeof window === "undefined") return;
	
	const event = new CustomEvent(EXTENSION_EVENTS.SAVE, {
		detail: {
			themeId,
			themeName,
			targetDomain
		}
	});
	window.dispatchEvent(event);
}

export function dispatchCheckThemeInstallation(themeId: string, targetDomain: string) {
	if (typeof window === "undefined") return;

	const event = new CustomEvent(EXTENSION_EVENTS.CHECK_INSTALL, {
		detail: {
			themeId,
			targetDomain
		}
	});
	window.dispatchEvent(event);
}
