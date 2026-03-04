export const themeState = $state({
    isLightMode: false,
});

export function updateTheme(isLight: boolean) {
    themeState.isLightMode = isLight;
}

export const defaultDescription = `# Level 1 Heading
## Level 2 Heading
### Level 3 Heading

---

**Emphasis & Format:**
* *Italic text* using asterisks or _underscores_.
* **Bold text** using double asterisks or __underscores__.
* ***Bold and Italic*** combining both.
* ~~Strikethrough~~ using double tildes.

---

**Lists:**
1. First ordered list item
2. Second item
    * Sub-item A
    * Sub-item B
3. Third item

* Unordered list item
* Another item
    - Indented sub-item
    - Another sub-item

---

**Links & Images:**
* [Google Search](https://www.google.com)
* ![Placeholder Image](https://i.pinimg.com/736x/3c/df/de/3cdfde6188b598374bc3df46cb885c1d.jpg)

---

**Blockquotes:**
> This is a blockquote.
>
> "The best way to predict the future is to invent it." - Alan Kay

---

**Code:**
Inline code: \`print("Hello World")\`

Code Block:
\`\`\`
def greeting(name):
    # This is a comment in Python
    return f"Hello, {name}!"

print(greeting("User"))
\`\`\`

---

**Tables:**
| Feature | Description | Status |
| :--- | :---: | ---: |
| Markdown | Lightweight markup | Active |
| Tables | Organized data | Support |

---

**Task Lists:**

* [x] Finished task
* [ ] Unfinished task
* [ ] Task with *italics*
`