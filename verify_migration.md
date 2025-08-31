# 🔍 Verify Slug Migration

## Quick Check: Is the Migration Working?

### Step 1: Check Database Structure
1. Go to your **Supabase Dashboard**
2. Open **Table Editor**
3. Click on the **products** table
4. Look for a column called **`slug`**

**✅ Success:** You see a `slug` column  
**❌ Failed:** No `slug` column → Run the SQL migration again

### Step 2: Check Slug Values
1. In the products table, look at a few rows
2. Check if the `slug` column has values like: `iphone-15-pro-max-abc123de`

**✅ Success:** Products have slug values  
**❌ Failed:** Slug column is empty → Run the UPDATE query

### Step 3: Test Frontend
1. Open: http://127.0.0.1:3001
2. Go to "Products" page
3. Click on any product
4. Check the URL in the address bar

**Expected URL formats:**
- ✅ **Good:** `/product/iphone-15-pro-max-abc123de`
- ❌ **Bad:** `/product/abc123def-456-789-ghi-012345678901`

## If Migration Failed

### Re-run the SQL Migration
Copy and paste this into Supabase SQL Editor:

```sql
-- Add slug column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug 
ON products(slug) 
WHERE slug IS NOT NULL;

-- Generate slugs for existing products
UPDATE products 
SET slug = lower(
  trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(name, '[^a-z0-9 ]', '', 'gi'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '-'
  )
) || '-' || right(replace(id::text, '-', ''), 8)
WHERE slug IS NULL;
```

### Test Again
1. Refresh your browser (Ctrl+F5)
2. Go to products page
3. Click on a product
4. Check if URL now shows the slug

## Debug Tools

### 1. Manual URL Test
Try typing this URL directly:
```
http://127.0.0.1:3001/product/test-product-12345678
```

- If it loads → Slug routing works
- If 404 error → Slug routing broken

### 2. Debug Page
Open this file in browser:
```
C:\Users\khali\OneDrive\Documents\kstores-1\src\debug-slugs.html
```

### 3. Network Tab
1. Open browser Dev Tools (F12)
2. Go to Network tab
3. Navigate to products page
4. Check the API responses to see if `slug` field is present

## Common Issues

### Issue 1: "Still seeing UUIDs"
**Cause:** Database doesn't have slugs yet  
**Fix:** Re-run the SQL migration above

### Issue 2: "Page not found with slug URL"
**Cause:** Frontend routing not updated  
**Fix:** Clear browser cache (Ctrl+F5) and restart dev server

### Issue 3: "Empty slug column"
**Cause:** UPDATE query didn't run  
**Fix:** Run this specific query:
```sql
UPDATE products 
SET slug = lower(name) || '-' || right(replace(id::text, '-', ''), 8)
WHERE slug IS NULL;
```

## Expected Results

After successful migration:

1. **Database:** Products table has `slug` column with values
2. **URLs:** Products show as `/product/readable-name-abc123de`
3. **Links:** All product links use slugs
4. **SEO:** URLs are now human-readable and SEO-friendly

## Contact Points

- **Database issues:** Check Supabase dashboard
- **Frontend issues:** Check browser console for errors  
- **Routing issues:** Restart dev server with `npm run dev`
