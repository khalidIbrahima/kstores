# Product Addition Script

A Node.js script to easily add products to your Supabase database.

## Prerequisites

1. **Node.js dependencies**: Make sure you have the required packages installed:
   ```bash
   npm install @supabase/supabase-js dotenv readline fs path
   ```

2. **Environment variables**: Set up your Supabase credentials in a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Optional: For admin operations
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Usage

### 1. Add Sample Products (Default)
```bash
node add_products.js
```
This will add predefined sample products to your database.

### 2. Add Custom Product (Interactive)
```bash
node add_products.js --custom
```
This will prompt you to enter product details interactively.

### 3. Bulk Import from JSON File
```bash
node add_products.js --file products-example.json
```
This will load products from a JSON file and add them to the database.

## JSON File Format

When using `--file` option, your JSON file should contain an array of product objects:

```json
[
  {
    "name": "Product Name",
    "description": "Product description (optional)",
    "price": 99.99,
    "image_url": "https://example.com/image.jpg",
    "stock": 50,
    "category_id": "optional-category-uuid"
  }
]
```

### Required Fields:
- `name` (string): Product name
- `price` (number): Product price (must be > 0)
- `image_url` (string): URL to product image
- `stock` (number): Stock quantity (must be ≥ 0)

### Optional Fields:
- `description` (string): Product description
- `category_id` (string): UUID of existing category

## Features

- ✅ **Validation**: Validates all product data before insertion
- ✅ **Error handling**: Continues processing even if some products fail
- ✅ **Category support**: Automatically assigns categories based on product names
- ✅ **Batch processing**: Handles multiple products efficiently
- ✅ **Detailed feedback**: Shows progress and results for each product
- ✅ **Connection testing**: Verifies Supabase connection before starting

## Database Schema

The script works with the following product table structure:

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
```

## Example Output

```
🚀 Product Addition Script for Supabase

✅ Connected to Supabase successfully

📂 Found 3 categories: Electronics, Accessories, Gaming

📦 Adding 5 products...

1/5 Adding: iPhone 15 Pro
✅ Successfully added: iPhone 15 Pro (ID: 123e4567-e89b-12d3-a456-426614174000)

2/5 Adding: Samsung Galaxy S24 Ultra
✅ Successfully added: Samsung Galaxy S24 Ultra (ID: 123e4567-e89b-12d3-a456-426614174001)

📊 Summary:
✅ Successfully added: 5 products
❌ Failed to add: 0 products
```

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and API keys
- Check if your project is active and accessible
- Ensure your network connection is stable

### Permission Issues
- Make sure your API key has sufficient permissions
- For admin operations, use the service role key
- Check your Row Level Security (RLS) policies

### Validation Errors
- Ensure all required fields are provided
- Check that prices are positive numbers
- Verify image URLs are valid
- Confirm stock values are non-negative integers

## Security Notes

- Never commit your `.env` file to version control
- Use the service role key only in secure environments
- The anon key should be sufficient for most operations if RLS is properly configured
- Always validate and sanitize input data

## Contributing

Feel free to extend this script with additional features like:
- CSV import support
- Image upload functionality
- Duplicate detection
- Category creation
- Product variants support
