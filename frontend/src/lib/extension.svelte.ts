export const extensionState = $state({
	isExtensionReady: false
});

export function initializeExtensionListener() {
	if (typeof window === "undefined") return;
	
	window.addEventListener("newtube_is_here", () => {
		console.log("NewTube extension detected!");
		extensionState.isExtensionReady = true;
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
}
