import MarkdownIt from "markdown-it";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup";

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: (code: string, lang: string, _attrs: string): string => {
        // Map common aliases to Prism language names
        const langMap: Record<string, string> = {
            py: "python",
            python: "python",
            js: "javascript",
            javascript: "javascript",
            ts: "typescript",
            typescript: "typescript",
            sh: "bash",
            bash: "bash",
            html: "markup",
            xml: "markup",
            css: "css",
            scss: "scss",
            json: "json",
        };
        const mappedLang = langMap[lang] || lang;

        if (mappedLang && Prism.languages[mappedLang]) {
            try {
                return `<pre class="language-${mappedLang}"><code>${Prism.highlight(code, Prism.languages[mappedLang], mappedLang)}</code></pre>`;
            } catch (e) {
                console.error("Prism highlighting error:", e);
            }
        }
        return `<pre class="language-none"><code>${md.utils.escapeHtml(code)}</code></pre>`;
    },
});

export function renderMarkdown(content: string): string {
    if (!content) return "";
    return md.render(content);
}
