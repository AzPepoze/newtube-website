export const themeState = $state({
    isLightMode: false,
});

export function updateTheme(isLight: boolean) {
    themeState.isLightMode = isLight;
}
