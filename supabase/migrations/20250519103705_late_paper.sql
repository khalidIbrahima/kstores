/*
  # Create customer groups table

  1. New Tables
    - `customer_groups`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `member_count` (integer, default 0)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `customer_groups` table
    - Add policies for admin access and public read
*/

CREATE TABLE IF NOT EXISTS customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer groups are viewable by everyone"
  ON customer_groups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Customer groups are manageable by admins"
  ON customer_groups
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );