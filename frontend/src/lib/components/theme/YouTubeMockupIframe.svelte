<script lang="ts">
	import { onMount } from "svelte";
	import type { Theme } from "$lib/types/index";
	import { YOUTUBE_BASE_STYLES } from "$lib/utils/youtubeBaseStyles";
	import {
		renderMastheadHtml,
		renderGuideSidebarHtml,
		renderWatchPageHtml,
		renderHomePageHtml,
		renderChannelPageHtml,
	} from "$lib/utils/youtubeMockupTemplates";

	let {
		theme,
		pageMode = "watch",
		height = "500px",
	}: {
		theme: Theme;
		pageMode?: "watch" | "home" | "channel";
		height?: string;
	} = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);

	function parseHexColorWithOpacity(
		colorStr: string,
		opacityVal?: number
	): string {
		if (!colorStr) return "rgba(0, 0, 0, 0.8)";
		if (colorStr.startsWith("rgba") || colorStr.startsWith("rgb")) {
			return colorStr;
		}

		let c = colorStr.trim().replace("#", "");
		let r = 0,
			g = 0,
			b = 0,
			a = 0.8;

		if (c.length === 8) {
			r = parseInt(c.slice(0, 2), 16);
			g = parseInt(c.slice(2, 4), 16);
			b = parseInt(c.slice(4, 6), 16);
			a = parseInt(c.slice(6, 8), 16) / 255;
		} else if (c.length === 6) {
			r = parseInt(c.slice(0, 2), 16);
			g = parseInt(c.slice(2, 4), 16);
			b = parseInt(c.slice(4, 6), 16);
			if (opacityVal !== undefined) {
				a = opacityVal > 1 ? opacityVal / 100 : opacityVal;
			}
		} else if (c.length === 3) {
			r = parseInt(c[0] + c[0], 16);
			g = parseInt(c[1] + c[1], 16);
			b = parseInt(c[2] + c[2], 16);
			if (opacityVal !== undefined) {
				a = opacityVal > 1 ? opacityVal / 100 : opacityVal;
			}
		} else {
			return colorStr;
		}

		if (opacityVal !== undefined && c.length === 8) {
			const factor = opacityVal > 1 ? opacityVal / 100 : opacityVal;
			a = Math.min(1, Math.max(0, a * factor));
		}

		return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
	}

	function buildCssVariables(t: Theme): string {
		const raw = t.settings || {};
		const currentSettings = raw.currentSettings || raw;

		let css = ":root, ytd-app, body {\n";

		for (const [key, val] of Object.entries(currentSettings)) {
			if (val === undefined || val === null) continue;
			if (typeof val === "boolean") {
				css += `  --${key}: ${val ? 1 : 0};\n`;
			} else if (typeof val === "number") {
				const unit =
					key.includes("Radius") ||
					key.includes("Size") ||
					key.includes("Height") ||
					key.includes("Width") ||
					key.includes("Amount") ||
					key.includes("Distance")
						? "px"
						: "";
				css += `  --${key}: ${val}${unit};\n`;
			} else {
				css += `  --${key}: ${val};\n`;
			}
		}

		const bgUrl =
			currentSettings.BackgroundImageUrl || currentSettings.bgImage || "";

		const bgTintColorRaw =
			currentSettings.BackgroundTintColor ||
			currentSettings.AppBackgroundColor ||
			currentSettings.backgroundColor ||
			currentSettings.bgTintColor ||
			currentSettings.BaseBackgroundColor ||
			currentSettings.bg ||
			"#00000099";

		const bgOpacityVal =
			currentSettings.BackgroundTintOpacity !== undefined
				? Number(currentSettings.BackgroundTintOpacity)
				: currentSettings.bgTintOpacity !== undefined
					? Number(currentSettings.bgTintOpacity)
					: undefined;

		const tintedRgba = parseHexColorWithOpacity(
			bgTintColorRaw,
			bgOpacityVal
		);

		const bgBlurAmount =
			currentSettings.BackgroundBlurAmount !== undefined
				? Number(currentSettings.BackgroundBlurAmount)
				: currentSettings.BackgroundBlur !== undefined
					? Number(currentSettings.BackgroundBlur)
					: currentSettings.bgBlur !== undefined
						? Number(currentSettings.bgBlur)
						: 0;

		const mainColor =
			currentSettings.MainThemeColor ||
			currentSettings.AppPrimaryColor ||
			currentSettings.primaryColor ||
			currentSettings.accentColor ||
			currentSettings.brandColor ||
			"#ff0000";
		const primaryText =
			currentSettings.PrimaryTextColor ||
			currentSettings.AppTextColor ||
			currentSettings.textColor ||
			currentSettings.primaryTextColor ||
			"#ffffff";
		const secondaryText =
			currentSettings.SecondaryTextColor ||
			currentSettings.secondaryTextColor ||
			"#aaaaaa";
		const channelNameColor = currentSettings.ChannelNameColor || primaryText;
		const topbarBg =
			currentSettings.TopbarBackgroundColor ||
			currentSettings.HeaderBackgroundColor ||
			"rgba(15,15,15,0.98)";
		const globalRadius =
			currentSettings.GlobalCornerRadius !== undefined
				? `${currentSettings.GlobalCornerRadius}px`
				: "10px";
		const playerRadius =
			currentSettings.VideoPlayerCornerRadius !== undefined
				? `${currentSettings.VideoPlayerCornerRadius}px`
				: "16px";
		const globalBorderColor =
			currentSettings.GlobalBorderColor || "rgba(255,255,255,0.1)";
		const chipsBg =
			currentSettings.ChipsBarBackgroundColor || "rgba(255,255,255,0.08)";

		css += `  --yt-spec-base-background: ${bgTintColorRaw};\n`;
		css += `  --nt-bg-main: ${bgTintColorRaw};\n`;
		css += `  --nt-bg-opacity: ${bgOpacityVal ?? 80};\n`;
		css += `  --nt-bg-blur-amount: ${bgBlurAmount}px;\n`;
		css += `  --yt-spec-brand-icon-color: ${mainColor};\n`;
		css += `  --yt-spec-text-primary: ${primaryText};\n`;
		css += `  --yt-spec-text-secondary: ${secondaryText};\n`;
		css += `  --yt-spec-call-to-action: ${mainColor};\n`;
		css += `  --TopbarBackgroundColor: ${topbarBg};\n`;
		css += `  --MainThemeColor: ${mainColor};\n`;
		css += `  --PrimaryTextColor: ${primaryText};\n`;
		css += `  --SecondaryTextColor: ${secondaryText};\n`;
		css += `  --ChannelNameColor: ${channelNameColor};\n`;
		css += `  --GlobalCornerRadius: ${globalRadius};\n`;
		css += `  --VideoPlayerCornerRadius: ${playerRadius};\n`;
		css += `  --GlobalBorderColor: ${globalBorderColor};\n`;
		css += `  --ChipsBarBackgroundColor: ${chipsBg};\n`;
		css += "}\n";

		if (bgUrl) {
			const repeat = currentSettings.BackgroundImageRepeat
				? "repeat"
				: "no-repeat";
			const posX = currentSettings.BackgroundImagePositionX || 50;
			const posY = currentSettings.BackgroundImagePositionY || 50;
			css += `
ytd-app {
    background-image: linear-gradient(${tintedRgba}, ${tintedRgba}), url("${bgUrl}") !important;
    background-size: cover !important;
    background-position: ${posX}% ${posY}% !important;
    background-repeat: ${repeat} !important;
    background-attachment: fixed !important;
}
body, #page-manager, ytd-browse, ytd-watch-flexy {
    background-color: transparent !important;
    background-image: none !important;
    ${bgBlurAmount > 0 ? `backdrop-filter: blur(${bgBlurAmount}px) !important; -webkit-backdrop-filter: blur(${bgBlurAmount}px) !important;` : ""}
}
`;
		} else {
			css += `
ytd-app, body {
    background-color: ${tintedRgba} !important;
    background-image: none !important;
}
#page-manager, ytd-browse, ytd-watch-flexy {
    background-color: transparent !important;
}
`;
		}

		return css;
	}

	function buildCustomCss(t: Theme): string {
		const raw = t.settings || {};
		let customCss = "";

		if (typeof raw.customCss === "string") {
			customCss += raw.customCss + "\n";
		}

		const addOnItems = raw.addOnStyleShiftItems || t.addOnStyleShiftItems;
		if (Array.isArray(addOnItems)) {
			for (const item of addOnItems) {
				if (item.css || item.code) {
					customCss += `/* AddOn: ${item.name || item.id || "Custom"} */\n${item.css || item.code}\n`;
				}
			}
		}

		return customCss;
	}

	function renderIframeContent() {
		if (!iframeEl) return;
		const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
		if (!doc) return;

		const varsCss = buildCssVariables(theme);
		const customCss = buildCustomCss(theme);

		const masthead = renderMastheadHtml();
		const guide = renderGuideSidebarHtml();

		let bodyContent = "";
		if (pageMode === "home") bodyContent = renderHomePageHtml();
		else if (pageMode === "channel") bodyContent = renderChannelPageHtml();
		else bodyContent = renderWatchPageHtml();

		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>YouTube Theme Live Preview</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <style id="styleshift-theme-vars">${varsCss}</style>
    <style id="styleshift-theme-custom-css">${customCss}</style>
    <style id="styleshift-base-mockup-styles">${YOUTUBE_BASE_STYLES}</style>
</head>
<body>
    <ytd-app>
        ${masthead}
        <div id="app-body-wrapper">
            ${guide}
            ${bodyContent}
        </div>
        <div class="preview-disclaimer">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px; color: #ffb700;">info</span>
            <div>
                Interactive Preview Mockup<br />
                <span style="font-size: 12px; font-weight: 500; color: #ccc;">Actual YouTube rendering may vary.</span>
            </div>
        </div>
    </ytd-app>
</body>
</html>`;

		doc.open();
		doc.write(htmlContent);
		doc.close();
	}

	$effect(() => {
		if (theme && iframeEl && pageMode) {
			renderIframeContent();
		}
	});

	onMount(() => {
		renderIframeContent();
	});
</script>

<div class="iframe-container glass-panel">
	<iframe
		bind:this={iframeEl}
		title="Live YouTube Theme Preview"
		class="preview-iframe"
		style:height
	></iframe>
</div>

<style lang="scss">
	.iframe-container {
		width: 100%;
		border-radius: var(--radius-lg, 16px);
		border: 1px solid var(--border-glass);
		overflow: hidden;
		background: #000;
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
	}

	.preview-iframe {
		width: 100%;
		border: none;
		display: block;
	}
</style>
