/**
 * YouTube Polymer DOM Template builders simulating authentic YouTube page structures,
 * Polymer elements, attributes, and mock content.
 */

export function renderMastheadHtml(): string {
    return `
    <div id="masthead-container">
        <div id="masthead">
            <div id="start">
                <button id="guide-button" title="Guide Drawer">
                    <span class="material-icons notranslate" translate="no" style="font-size: 22px;">menu</span>
                </button>
                <a id="logo" href="#" title="YouTube Home">
                    <svg id="logo-icon" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    <span>YouTube</span>
                </a>
            </div>
            <div id="center">
                <div id="search-form">
                    <input type="text" placeholder="Search" disabled />
                    <button id="search-icon-legacy" title="Search"><span class="material-icons notranslate" translate="no" style="font-size: 18px;">search</span></button>
                </div>
            </div>
            <div id="end">
                <button class="end-icon-btn" title="Create"><span class="material-icons notranslate" translate="no" style="font-size: 20px;">video_call</span></button>
                <button class="end-icon-btn" title="Notifications"><span class="material-icons notranslate" translate="no" style="font-size: 20px;">notifications</span></button>
                <div class="avatar-img" title="User Profile">A</div>
            </div>
        </div>
    </div>`;
}

export function renderGuideSidebarHtml(): string {
    return `
    <div id="guide">
        <a class="guide-entry active" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">home</span>
            <span>Home</span>
        </a>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">explore</span>
            <span>Shorts</span>
        </a>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">subscriptions</span>
            <span>Subscriptions</span>
        </a>
        <div class="guide-divider"></div>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">video_library</span>
            <span>Library</span>
        </a>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">history</span>
            <span>History</span>
        </a>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">thumb_up</span>
            <span>Liked Videos</span>
        </a>
        <div class="guide-divider"></div>
        <a class="guide-entry" href="#">
            <span class="material-icons notranslate" translate="no" style="font-size: 20px;">settings</span>
            <span>Settings</span>
        </a>
    </div>`;
}

export function renderWatchPageHtml(): string {
    return `
    <div id="page-manager">
        <ytd-watch-flexy>
            <div id="columns">
                <div id="primary">
                    <div id="player">
                        <div class="play-icon-big"><span class="material-icons notranslate" translate="no" style="font-size: 28px;">play_arrow</span></div>
                    </div>
                    <ytd-watch-metadata>
                        <h1 class="ytd-watch-metadata">YouTube Theme Live Demonstration - Authentic DOM Selectors</h1>
                        <div id="owner">
                            <ytd-video-owner-renderer>
                                <div class="channel-avatar-lg">YT</div>
                                <div>
                                    <div id="channel-name">StyleShift Channel</div>
                                    <div id="owner-sub-count">2.5M subscribers</div>
                                </div>
                            </ytd-video-owner-renderer>
                            <div id="actions">
                                <div id="subscribe-button"><button>Subscribe</button></div>
                                <button class="yt-chip-btn"><span class="material-icons notranslate" translate="no" style="font-size: 16px;">thumb_up</span> 128K</button>
                                <button class="yt-chip-btn"><span class="material-icons notranslate" translate="no" style="font-size: 16px;">share</span> Share</button>
                                <button class="yt-chip-btn"><span class="material-icons notranslate" translate="no" style="font-size: 16px;">download</span> Download</button>
                            </div>
                        </div>
                        <div id="description-inner">
                            Full custom theme preview displaying background image, primary accent colors, control panels, border radii, and all user settings applied directly to YouTube DOM selectors.
                        </div>
                    </ytd-watch-metadata>
                    
                    <div id="comments">
                        <div class="comments-header">
                            <span>428 Comments</span>
                            <span style="font-size: 13px; font-weight: 500; color: #aaa; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                                <span class="material-icons notranslate" translate="no" style="font-size: 18px;">sort</span> Sort by
                            </span>
                        </div>
                        <div class="comment-item">
                            <div class="comment-avatar">U1</div>
                            <div class="comment-text-box">
                                <span class="comment-author">@ThemeDesigner • 2 hours ago</span>
                                <span>The live theme preview with custom background tinting and border radius works perfectly!</span>
                            </div>
                        </div>
                        <div class="comment-item">
                            <div class="comment-avatar">U2</div>
                            <div class="comment-text-box">
                                <span class="comment-author">@YouTubeUser • 5 hours ago</span>
                                <span>Clean polymer DOM mockup rendering feels super fast and reliable.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="secondary">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">Up Next</div>
                    <ytd-compact-video-renderer>
                        <div class="thumbnail-box"><span class="time-badge">14:20</span></div>
                        <div class="details-box">
                            <div class="rec-title">Creating Chrome Extensions with Svelte 5</div>
                            <div class="rec-meta">StyleShift • 140K views</div>
                        </div>
                    </ytd-compact-video-renderer>
                    <ytd-compact-video-renderer>
                        <div class="thumbnail-box"><span class="time-badge">08:45</span></div>
                        <div class="details-box">
                            <div class="rec-title">Advanced CSS Theme Customization Guide</div>
                            <div class="rec-meta">Design Studio • 52K views</div>
                        </div>
                    </ytd-compact-video-renderer>
                    <ytd-compact-video-renderer>
                        <div class="thumbnail-box"><span class="time-badge">22:15</span></div>
                        <div class="details-box">
                            <div class="rec-title">YouTube Ambient Light & Dark Themes</div>
                            <div class="rec-meta">NewTube • 98K views</div>
                        </div>
                    </ytd-compact-video-renderer>
                </div>
            </div>
        </ytd-watch-flexy>
    </div>`;
}

export function renderHomePageHtml(): string {
    return `
    <div id="page-manager">
        <ytd-browse page-subtype="home">
            <div id="chips-wrapper">
                <ytd-feed-filter-chip-bar-renderer id="chips">
                    <yt-chip-cloud-chip-renderer class="active">All</yt-chip-cloud-chip-renderer>
                    <yt-chip-cloud-chip-renderer>Gaming</yt-chip-cloud-chip-renderer>
                    <yt-chip-cloud-chip-renderer>Music</yt-chip-cloud-chip-renderer>
                    <yt-chip-cloud-chip-renderer>Live</yt-chip-cloud-chip-renderer>
                    <yt-chip-cloud-chip-renderer>Tech</yt-chip-cloud-chip-renderer>
                    <yt-chip-cloud-chip-renderer>Podcasts</yt-chip-cloud-chip-renderer>
                </ytd-feed-filter-chip-bar-renderer>
            </div>

            <ytd-rich-grid-renderer>
                <div id="contents" class="grid-layout">
                    ${[1, 2, 3, 4]
                        .map(
                            (i) => `
                    <ytd-rich-item-renderer>
                        <ytd-rich-grid-media>
                            <div id="thumbnail">
                                <div class="grid-thumb-box"></div>
                                <span class="time-badge">${10 + i}:${20 + i * 3}</span>
                            </div>
                            <div id="details">
                                <div id="avatar-link">
                                    <div class="channel-avatar-grid">CH${i}</div>
                                </div>
                                <div id="meta">
                                    <h3 id="video-title">YouTube Home Grid Video Item #${i}</h3>
                                    <div id="channel-name">Channel Creator ${i}</div>
                                    <div id="metadata-line">${i * 45}K views • ${i} days ago</div>
                                </div>
                            </div>
                        </ytd-rich-grid-media>
                    </ytd-rich-item-renderer>
                    `,
                        )
                        .join("")}
                </div>
            </ytd-rich-grid-renderer>
        </ytd-browse>
    </div>`;
}

export function renderChannelPageHtml(): string {
    return `
    <div id="page-manager">
        <ytd-browse page-subtype="channels">
            <div id="channel-header">
                <div id="header-banner"></div>
                <div id="channel-header-container">
                    <div class="channel-avatar-xl">ST</div>
                    <div class="channel-info-meta">
                        <h1 class="channel-title">StyleShift Official Channel</h1>
                        <div class="channel-handle">@StyleShift • 1.5M subscribers • 420 videos</div>
                    </div>
                    <button class="channel-sub-btn">Subscribe</button>
                </div>
            </div>

            <ytd-tabbed-page-header>
                <div id="tabs-container">
                    <tp-yt-paper-tab class="active">Home</tp-yt-paper-tab>
                    <tp-yt-paper-tab>Videos</tp-yt-paper-tab>
                    <tp-yt-paper-tab>Shorts</tp-yt-paper-tab>
                    <tp-yt-paper-tab>Playlists</tp-yt-paper-tab>
                </div>
            </ytd-tabbed-page-header>

            <div id="contents" class="grid-layout" style="padding-top: 8px;">
                ${[1, 2]
                    .map(
                        (i) => `
                <ytd-rich-item-renderer>
                    <ytd-rich-grid-media>
                        <div id="thumbnail">
                            <div class="grid-thumb-box"></div>
                            <span class="time-badge">${15 + i}:${10 + i * 2}</span>
                        </div>
                        <div id="details">
                            <div id="meta" style="margin-left: 0;">
                                <h3 id="video-title">Channel Upload #${i} - Custom Style</h3>
                                <div id="metadata-line">${i * 80}K views • 1 week ago</div>
                            </div>
                        </div>
                    </ytd-rich-grid-media>
                </ytd-rich-item-renderer>
                `,
                    )
                    .join("")}
            </div>
        </ytd-browse>
    </div>`;
}
