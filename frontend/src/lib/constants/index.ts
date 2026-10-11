import { env } from "$env/dynamic/public";

export const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

export enum ThemeStoreEvent {
    INSTALL = "install_newtube_theme",
    SAVE = "save_newtube_theme",
    CHECK_INSTALL = "is_newtube_theme_installed",
    READY = "newtube_is_ready",
    INSTALL_STATUS = "newtube_theme_install_status",
    CHECK_EXTENSION = "check_newtube_extension",
}

export const EXTENSION_EVENTS = ThemeStoreEvent;

export const SUPPORTED_DOMAINS = ["youtube.com"];
