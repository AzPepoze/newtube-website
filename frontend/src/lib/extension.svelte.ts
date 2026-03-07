export const extensionState = $state({
	isExtensionReady: false,
	installedThemeId: null as string | null
});

export function initializeExtensionListener() {
	if (typeof window === "undefined") return;
	
	window.addEventListener("newtube_is_here", () => {
		console.log("NewTube extension detected!");
		extensionState.isExtensionReady = true;
		
		// Ask the extension which theme is installed
		window.dispatchEvent(new CustomEvent("is_theme_installed"));
	});

	window.addEventListener("installed_theme", (e: Event) => {
		const customEvent = e as CustomEvent;
		if (customEvent.detail && customEvent.detail.themeId) {
			extensionState.installedThemeId = customEvent.detail.themeId;
		}
	});
}

export function dispatchThemeInstallation(themeId: string, themeName: string, themeData: any) {
	if (typeof window === "undefined") return;
	
	const event = new CustomEvent("install_newtube_theme", {
		detail: {
			themeId,
			themeName,
			themeData
		}
	});
	window.dispatchEvent(event);
	
	extensionState.installedThemeId = themeId;
}
