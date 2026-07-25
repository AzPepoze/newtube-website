/**
 * Base CSS styles simulating authentic YouTube Polymer stylesheet rules,
 * CSS variable defaults, and element structure.
 */
export const YOUTUBE_BASE_STYLES = `
* { box-sizing: border-box; }
html, body {
    margin: 0; padding: 0; width: 100%; height: 100%;
    font-family: "Roboto", "Arial", sans-serif;
    background: #0f0f0f; color: #f1f1f1;
    overflow-x: hidden;
}
.material-icons.notranslate {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    user-select: none;
}

/* YouTube App Container */
ytd-app {
    display: flex; flex-direction: column; min-height: 100vh;
    background-color: var(--yt-spec-base-background, #0f0f0f);
    position: relative;
}

/* Topbar / Masthead */
#masthead-container {
    position: sticky; top: 0; z-index: 100;
}
#masthead {
    height: 56px; padding: 0 16px;
    display: flex; align-items: center; justify-content: space-between;
    background: var(--TopbarBackgroundColor, rgba(15, 15, 15, 0.98));
    border-bottom: 1px solid var(--GlobalBorderColor, rgba(255, 255, 255, 0.1));
}
#masthead #start { display: flex; align-items: center; gap: 16px; }
#guide-button { background: transparent; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; padding: 8px; border-radius: 50%; }
#guide-button:hover { background: rgba(255,255,255,0.1); }
#masthead #logo { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 18px; text-decoration: none; color: inherit; }
#logo-icon { fill: var(--MainThemeColor, #ff0000); width: 28px; height: 20px; }
#masthead #center { flex: 1; max-width: 540px; margin: 0 16px; display: flex; align-items: center; gap: 12px; }
#search-form { display: flex; align-items: center; flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); border-radius: 40px; overflow: hidden; padding-left: 14px; }
#search-form input { flex: 1; background: transparent; border: none; outline: none; color: inherit; height: 38px; font-size: 14px; }
#search-icon-legacy { width: 54px; height: 38px; background: rgba(255,255,255,0.08); border: none; border-left: 1px solid rgba(255,255,255,0.18); cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; }
#masthead #end { display: flex; align-items: center; gap: 14px; }
.end-icon-btn { background: transparent; border: none; color: #fff; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; }
.end-icon-btn:hover { background: rgba(255,255,255,0.1); }
.avatar-img { width: 32px; height: 32px; border-radius: 50%; background: var(--MainThemeColor, #9c80ea); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; color: #fff; }

/* Main Page Manager & Layout Grid */
#app-body-wrapper { display: flex; flex: 1; width: 100%; }

/* Left Collapsible Guide Sidebar */
#guide {
    width: 216px; background: transparent; flex-shrink: 0; padding: 12px 8px;
    display: flex; flex-direction: column; gap: 4px;
    border-right: 1px solid var(--GlobalBorderColor, rgba(255, 255, 255, 0.08));
}
.guide-entry {
    display: flex; align-items: center; gap: 20px; padding: 10px 14px;
    border-radius: var(--GlobalCornerRadius, 10px); color: var(--PrimaryTextColor, #fff);
    font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none;
    transition: background 0.15s;
}
.guide-entry:hover { background: rgba(255, 255, 255, 0.1); }
.guide-entry.active { background: rgba(255, 255, 255, 0.15); font-weight: 700; }
.guide-divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 8px 0; }

#page-manager { display: flex; flex-direction: column; flex: 1; padding: 20px; min-width: 0; }

/* Watch Page Layout */
ytd-watch-flexy { display: flex; width: 100%; margin: 0 auto; max-width: 1580px; }
#columns { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; width: 100%; }
@media (max-width: 900px) { #columns { grid-template-columns: 1fr; } #guide { display: none; } }

#primary { min-width: 0; }
#player, ytd-player, #movie_player {
    width: 100%; aspect-ratio: 16/9; background: #000;
    border-radius: var(--VideoPlayerCornerRadius, 12px);
    position: relative; overflow: hidden;
    border: 1px solid var(--GlobalBorderColor, rgba(255,255,255,0.1));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.play-icon-big { width: 64px; height: 44px; background: var(--MainThemeColor, #ff0000); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }

ytd-watch-metadata { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
h1.ytd-watch-metadata { font-size: 20px; margin: 0; font-weight: 700; color: var(--PrimaryTextColor, #fff); line-height: 1.35; }
#owner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
ytd-video-owner-renderer { display: flex; align-items: center; gap: 12px; }
.channel-avatar-lg { width: 40px; height: 40px; border-radius: 50%; background: var(--MainThemeColor, #9c80ea); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: #fff; }
#channel-name { font-weight: 700; font-size: 14px; color: var(--ChannelNameColor, #fff); }
#owner-sub-count { font-size: 12px; color: var(--SecondaryTextColor, #aaa); }
#subscribe-button button, .channel-sub-btn {
    background: var(--MainThemeColor, #cc0000); color: var(--PrimaryTextColor, #fff);
    border: none; border-radius: 20px; padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer;
    transition: transform 0.15s, filter 0.15s;
}
#subscribe-button button:hover, .channel-sub-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
#actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.yt-chip-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: var(--PrimaryTextColor, #fff); display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.yt-chip-btn:hover { background: rgba(255,255,255,0.15); }
#description-inner { background: rgba(255,255,255,0.05); border-radius: var(--GlobalCornerRadius, 12px); padding: 14px; font-size: 13px; line-height: 1.5; color: var(--PrimaryTextColor, #fff); margin-top: 8px; border: 1px solid rgba(255,255,255,0.08); }

/* Comments Section */
#comments { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
.comments-header { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 24px; }
.comment-item { display: flex; gap: 12px; }
.comment-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; }
.comment-text-box { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.comment-author { font-weight: 700; font-size: 12px; color: var(--PrimaryTextColor, #fff); }

/* Sidebar Video Recommendations */
#secondary { display: flex; flex-direction: column; gap: 12px; }
ytd-compact-video-renderer {
    display: flex; gap: 10px; border-radius: var(--GlobalCornerRadius, 10px);
    padding: 6px; transition: background 0.2s; cursor: pointer;
}
ytd-compact-video-renderer:hover { background: rgba(255,255,255,0.08); }
.thumbnail-box { width: 150px; height: 84px; background: rgba(255,255,255,0.12); border-radius: var(--GlobalCornerRadius, 8px); flex-shrink: 0; position: relative; overflow: hidden; }
.time-badge { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.85); padding: 2px 5px; font-size: 11px; font-weight: 700; border-radius: 4px; color: #fff; }
.details-box { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.rec-title { font-weight: 700; font-size: 13px; line-height: 1.3; color: var(--PrimaryTextColor, #fff); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rec-meta { font-size: 11px; color: var(--SecondaryTextColor, #aaa); }

/* Home Feed Filter Chips & Grid */
#chips-wrapper { margin-bottom: 16px; }
#chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; }
yt-chip-cloud-chip-renderer {
    background: var(--ChipsBarBackgroundColor, rgba(255,255,255,0.08));
    border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap; color: var(--PrimaryTextColor, #fff); border: 1px solid rgba(255,255,255,0.1);
}
yt-chip-cloud-chip-renderer.active {
    background: var(--PrimaryTextColor, #fff); color: var(--yt-spec-base-background, #0f0f0f); font-weight: 700;
}

.grid-layout {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px; width: 100%;
}

ytd-rich-item-renderer { display: flex; flex-direction: column; }
ytd-rich-grid-media { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
.grid-thumb-box {
    width: 100%; aspect-ratio: 16/9; background: rgba(255,255,255,0.12);
    border-radius: var(--GlobalCornerRadius, 12px); position: relative; overflow: hidden;
    border: 1px solid var(--GlobalBorderColor, rgba(255,255,255,0.08));
}
#details { display: flex; gap: 10px; }
.channel-avatar-grid {
    width: 36px; height: 36px; border-radius: 50%; background: var(--MainThemeColor, #9c80ea);
    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #fff; flex-shrink: 0;
}
#meta #video-title { font-size: 14px; font-weight: 700; line-height: 1.35; margin: 0 0 4px; color: var(--PrimaryTextColor, #fff); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
#meta #channel-name { font-size: 12px; color: var(--ChannelNameColor, #aaa); font-weight: 600; }
#meta #metadata-line { font-size: 11px; color: var(--SecondaryTextColor, #aaa); }

/* Channel Page Header & Banner */
#channel-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
#header-banner { width: 100%; height: 130px; background: var(--MainThemeColor, linear-gradient(135deg, #ff0055, #7a00ff)); border-radius: var(--GlobalCornerRadius, 14px); opacity: 0.9; }
#channel-header-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.channel-avatar-xl { width: 72px; height: 72px; border-radius: 50%; background: var(--MainThemeColor, #9c80ea); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; border: 3px solid rgba(255,255,255,0.2); }
.channel-info-meta { flex: 1; }
.channel-title { margin: 0 0 4px; font-size: 22px; font-weight: 800; color: var(--PrimaryTextColor, #fff); }
.channel-handle { font-size: 12px; color: var(--SecondaryTextColor, #aaa); }

#tabs-container { display: flex; gap: 24px; border-bottom: 1px solid rgba(255,255,255,0.12); margin-bottom: 16px; }
tp-yt-paper-tab { padding: 10px 0; font-weight: 700; font-size: 14px; color: var(--SecondaryTextColor, #aaa); cursor: pointer; border-bottom: 3px solid transparent; }
tp-yt-paper-tab.active { color: var(--PrimaryTextColor, #fff); border-bottom-color: var(--MainThemeColor, #ff0000); }

/* Text Shadows for Legibility */
h1.ytd-watch-metadata, #video-title, .rec-title, .channel-title { text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); }
#channel-name, #owner-sub-count, #metadata-line, .rec-meta, .channel-handle { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85); }

/* Sticky Floating Disclaimer Capsule */
.preview-disclaimer {
    position: sticky; bottom: 16px; align-self: center; margin: auto auto 16px auto; z-index: 9999;
    background: rgba(17, 17, 20, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 20px;
    color: #ffffff; font-size: 14px; font-weight: 700; padding: 10px 28px; text-align: center;
    display: inline-flex; align-items: center; justify-content: center; gap: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.85); pointer-events: none;
    width: max-content; max-width: calc(100% - 24px); box-sizing: border-box;
    line-height: 1.35;
}
`;
