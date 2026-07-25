import { env } from "$env/dynamic/public";

export const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

export enum ThemeStoreEvent {
    INSTALL = "install_styleshift_theme",
    SAVE = "save_styleshift_theme",
    CHECK_INSTALL = "is_styleshift_theme_installed",
    READY = "styleshift_is_ready",
    INSTALL_STATUS = "styleshift_theme_install_status",
    CHECK_EXTENSION = "check_styleshift_extension",
}

export const EXTENSION_EVENTS = ThemeStoreEvent;

export const SUPPORTED_DOMAINS = ["youtube.com"];
