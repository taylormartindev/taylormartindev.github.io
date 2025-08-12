---
title: "A Comprehensive Guide to Markdown"
date: 2025-08-04T22:45:00-04:00
draft: false
tags: ["markdown", "guide", "cheatsheet"]
---
{{< details summary="Click here to view a list of useful markdown references. Mostly just a reference to help me with future posts, but I figured anyone might get some use out of it. I'll be updating this with any other cool markdown tricks I find. <br><br>" >}}

# Markdown 101

This post is a live demonstration of what you can achieve with Markdown, the simple and elegant syntax for writing for the web. Everything you see here is written in a plain text `.md` file.

## Headings

Headings are created with the `#` symbol. The number of symbols corresponds to the heading level.

# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

---

## Text Formatting

You can easily format text for emphasis.

-   **Bold Text** is created with two asterisks or underscores: `**Bold Text**` or `__Bold Text__`.
-   *Italic Text* is created with one asterisk or underscore: `*Italic Text*` or `_Italic Text_`.
-   ***Bold and Italic*** text uses three: `***Bold and Italic***`.
-   You can `highlight inline code` with backticks: `` `highlight inline code` ``.
-   Strikethrough text is also possible with tildes: ~~This is a mistake~~.

---

## Blockquotes

Blockquotes are perfect for highlighting quotations or important notes.

> "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one."
>
> > -- Mark Twain (This is a nested blockquote)

---

## Lists

You can create both ordered and unordered lists.

### Unordered List

-   Item 1
-   Item 2
    -   Nested Item 2a
    -   Nested Item 2b
-   Item 3

### Ordered List

1.  First item
2.  Second item
3.  Third item
    1.  Indented item
    2.  Another indented item
4.  Even if I type `1.` here, the list will automatically number it correctly.

---

## Links and Images

### Links

There are a few ways to create links.

-   **Inline Link:** [Visit Google](https://www.google.com)
-   **Link with a Title:** [Hugo's Website](https://gohugo.io/ "The world’s fastest framework for building websites") - (Hover over the link to see the title).
-   **Reference-style Link:** This can make your source text cleaner. You define the link elsewhere in the document. Here is an example of [a reference link][1].

[1]: https://www.markdownguide.org "Markdown Guide"

### Images

The syntax is similar to links, but with a `!` at the beginning.

![A random placeholder image of a landscape](https://picsum.photos/seed/hugo/600/300 "Landscape Photo")
![A local image for the site](/images/goldPig.png "Landscape Photo")

---

## Code Blocks

One of Markdown's best features is its clean code formatting. Use three backticks (```) to create a fenced code block, and you can add a language for syntax highlighting.

### JavaScript Example
```javascript
// A simple function to add two numbers
function add(a, b) {
  // Check if both inputs are numbers
  if (typeof a !== 'number' || typeof b !== 'number') {
    return 0;
  }
  return a + b;
}

console.log(add(5, 10)); // Outputs: 15

```

{{< /details >}}