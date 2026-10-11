import { EXTENSION_EVENTS, PUBLIC_API_URL } from "$lib/constants/index";

export const extensionState = $state({
    isExtensionReady: false,
    installedThemeId: null as string | null,
    installingThemeId: null as string | null,
});

const installTimeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

// Mirror of newtube/src/core/theme/storeProtocol.ts — keep byte-identical.
const EXTENSION_MESSAGE_SOURCE = "newtube-extension";
const EXTENSION_MESSAGE_DIRECTION = "ext-to-page";

function markExtensionReady() {
    console.log("NewTube extension detected!");
    extensionState.isExtensionReady = true;
}

function applyInstallStatus(detail: {
    themeId?: string;
    isInstalled?: boolean;
}) {
    if (!detail?.themeId) return;

    if (extensionState.installingThemeId === detail.themeId) {
        extensionState.installingThemeId = null;
        if (installTimeoutMap.has(detail.themeId)) {
            clearTimeout(installTimeoutMap.get(detail.themeId));
            installTimeoutMap.delete(detail.themeId);
        }
    }

    if (detail.isInstalled === true) {
        extensionState.installedThemeId = detail.themeId;
    } else if (
        detail.isInstalled === false &&
        extensionState.installedThemeId === detail.themeId
    ) {
        extensionState.installedThemeId = null;
    }
}

export function initializeExtensionListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("message", (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const msg = event.data;
        if (typeof msg !== "object" || msg === null) return;
        if (
            msg.source !== EXTENSION_MESSAGE_SOURCE ||
            msg.direction !== EXTENSION_MESSAGE_DIRECTION
        ) {
            return;
        }
        if (msg.type === EXTENSION_EVENTS.READY) {
            markExtensionReady();
        } else if (msg.type === EXTENSION_EVENTS.INSTALL_STATUS) {
            applyInstallStatus(msg.detail);
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
