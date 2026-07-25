import { EXTENSION_EVENTS, PUBLIC_API_URL } from "$lib/constants/index";

export const extensionState = $state({
    isExtensionReady: false,
    installedThemeId: null as string | null,
    installingThemeId: null as string | null,
});

const installTimeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

export function initializeExtensionListener() {
    if (typeof window === "undefined") return;

    window.addEventListener(EXTENSION_EVENTS.READY, () => {
        console.log("NewTube extension detected!");
        extensionState.isExtensionReady = true;
    });

    window.addEventListener(EXTENSION_EVENTS.INSTALL_STATUS, (event: Event) => {
        const customEvent = event as CustomEvent<{
            themeId?: string;
            isInstalled?: boolean;
        }>;
        const d = customEvent.detail;
        if (!d?.themeId) return;

        if (extensionState.installingThemeId === d.themeId) {
            extensionState.installingThemeId = null;
            if (installTimeoutMap.has(d.themeId)) {
                clearTimeout(installTimeoutMap.get(d.themeId));
                installTimeoutMap.delete(d.themeId);
            }
        }

        if (d.isInstalled === true) {
            extensionState.installedThemeId = d.themeId;
        } else if (
            d.isInstalled === false &&
            extensionState.installedThemeId === d.themeId
        ) {
            extensionState.installedThemeId = null;
        }
    });

    window.dispatchEvent(new CustomEvent(EXTENSION_EVENTS.CHECK_EXTENSION));
}

export function dispatchThemeInstallation(
    themeId: string,
    themeName: string,
    targetDomains: string[],
) {
    if (typeof window === "undefined") return;

    extensionState.installingThemeId = themeId;

    if (installTimeoutMap.has(themeId)) {
        clearTimeout(installTimeoutMap.get(themeId));
    }

    const timeout = setTimeout(() => {
        if (extensionState.installingThemeId === themeId) {
            extensionState.installingThemeId = null;
            if (targetDomains.length > 0) {
                dispatchCheckThemeInstallation(themeId, targetDomains[0]);
            }
        }
        installTimeoutMap.delete(themeId);
    }, 8000);

    installTimeoutMap.set(themeId, timeout);

    const event = new CustomEvent(EXTENSION_EVENTS.INSTALL, {
        detail: {
            themeId,
            themeName,
            targetDomains,
        },
    });
    window.dispatchEvent(event);

    void fetch(`${PUBLIC_API_URL}/themes/${themeId}/download`, {
        method: "POST",
    }).catch(() => {});
}

export function dispatchThemeSave(
    themeId: string,
    themeName: string,
    targetDomain: string,
) {
    if (typeof window === "undefined") return;

    const event = new CustomEvent(EXTENSION_EVENTS.SAVE, {
        detail: {
            themeId,
            themeName,
            targetDomain,
        },
    });
    window.dispatchEvent(event);
}

export function dispatchCheckThemeInstallation(
    themeId: string,
    targetDomain: string,
) {
    if (typeof window === "undefined") return;

    const event = new CustomEvent(EXTENSION_EVENTS.CHECK_INSTALL, {
        detail: {
            themeId,
            targetDomain,
        },
    });
    window.dispatchEvent(event);
}
