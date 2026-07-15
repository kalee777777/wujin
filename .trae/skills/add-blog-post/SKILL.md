---
name: "add-blog-post"
description: "Adds a new blog post to the HOLGENVY website. Invoke when user says 'add a new blog post' or 'new post' or asks to add/increase blog articles."
---

# Add Blog Post Skill

This skill handles adding new blog posts to the HOLGENVY website. It follows a strict workflow to create the post detail page, update the blog list page, and sync the Latest Blog section on the resources page.

## Workflow

### Step 1: Understand the Post Topic
- Confirm the title, category, date, and key topics for the new blog post
- If the user doesn't provide enough detail, ask for clarification

### Step 2: Create Blog Post Detail Page
- File path: `blog-post-[slug].html` (e.g., `blog-post-safety-standards.html`)
- Follow the exact structure of existing blog post pages:
  - Hero section with placeholder image
  - Left-right two-column layout (main content + sidebar)
  - Breadcrumb navigation
  - Back to Blog link
  - Article meta (date, read time, views)
  - Article title (h1)
  - Article excerpt
  - Article body with proper headings (h2, h3), lists (ul/ol), and blockquotes
  - Share buttons (LinkedIn, Twitter, Copy, Email)
  - Author box
  - Sidebar: Category tags, Related Posts, Related Products, Quick Links
  - SEO meta tags (title, description, keywords, canonical, Open Graph)
- Use placeholder images for featured image and product thumbnails

### Step 3: Update `blog.html` (Blog List Page)
- Insert the new blog card into the **first position** of `<div class="blog-page-grid">`
- Shift all existing cards down by one position
- **Do NOT delete any old posts** — all posts remain, just shifted down
- **Pagination rule**: When total posts exceed **9**, auto-generate pagination
  - Page 1: posts 1-9 (3 columns × 3 rows)
  - Page 2: posts 10-18
  - Page 3: posts 19-27, etc.
  - Add pagination navigation at the bottom of the grid
- Each card must have:
  - Correct `href` pointing to the new detail page
  - Proper blog-img placeholder
  - Correct blog-tag, blog-date, title, excerpt, and blog-read-more

### Step 4: Update `resources.html` (Latest Blog Section)
- Replace the 3 blog cards in `<div class="blog-grid">` with the **first 3 posts** from `blog.html`
- Sync all card details: href, tag, date, title, excerpt
- The order must match `blog.html` positions 1, 2, 3

### Step 5: Validate
- Open the new detail page and verify it loads correctly
- Verify `blog.html` shows the new post in position 1
- Verify `resources.html` Latest Blog shows the correct 3 cards

## Post Lifecycle Rule

```
blog.html (paginated, 9 per page)    resources.html Latest Blog (top 3)
┌──────────────────────┐            ┌──────────────┐
│ Page 1 (posts 1-9)   │            │ Post 1 (new)  │
│ ┌──┐ ┌──┐ ┌──┐      │            │ Post 2        │
│ │1 │ │2 │ │3 │      │            │ Post 3        │
│ │4 │ │5 │ │6 │      │            └──────────────┘
│ │7 │ │8 │ │9 │      │
│ └──┘ └──┘ └──┘      │
│ ◀ 1 2 3 ... ▶       │
├──────────────────────┤
│ Page 2 (posts 10-18) │
│ Page 3 (posts 19-27) │
└──────────────────────┘
```

**Rules:**
1. New post always goes to position 1 (first card on page 1)
2. All existing posts shift down by 1 (no deletion)
3. When total ≤ 9 posts: single page, no pagination
4. When total > 9 posts: auto-paginate, 9 per page
5. `resources.html` always syncs the top 3 posts

## Pagination Implementation

When pagination is needed:
- Create a `blog-page-2.html`, `blog-page-3.html`, etc. for additional pages
- Or implement client-side pagination with JavaScript (toggle visibility)
- Add pagination nav with "Previous" / "Next" and page number buttons
- Style pagination to match the website's design

## Existing Blog Posts (for reference)

Current blog post files:
- `blog-post.html` - Top 5 Power Tool Trends to Watch in 2025
- `blog-post-evaluate-supplier-china.html` - How to Evaluate a Power Tool Supplier in China
- `blog-post-brushless-vs-brushed-motors.html` - Brushless vs Brushed Motors: What's the Difference?
- `blog-post-professional-tool-selection-guide.html` - Professional Tool Selection Guide for 2025
- `blog-post-lithium-ion-battery-technology.html` - Understanding Lithium-Ion Battery Technology
- `blog-post-oem-vs-odm-manufacturing.html` - OEM vs ODM: Which Manufacturing Model Is Right for You?

## Style Reference

Use the website's existing style:
- Font: Bebas Neue (display), Plus Jakarta Sans (body)
- Colors: Neon green (#39FF14) accents, white card backgrounds, dark backgrounds
- Layout: Two-column grid with 340px sidebar
- Component classes: blog-hero, blog-post-layout, blog-post-main, article-body, blog-post-sidebar, sidebar-section, share-btn-circle, author-box-inline