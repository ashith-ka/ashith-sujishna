-- SQL Schema for Supabase Setup
-- Run this in the Supabase SQL Editor

-- 1. Create the photos table
CREATE TABLE photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  face_embedding VECTOR(128) -- Requires pgvector extension
);

-- 2. Create the storage bucket
-- Note: You should manually create a bucket named 'memories' in the Supabase Storage UI 
-- and set it to 'Public'.

-- 3. Set up Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view photos
CREATE POLICY "Public Access" ON photos FOR SELECT USING (true);

-- Allow anyone to upload (For simplicity in a wedding context, 
-- but you can restrict this with Auth later)
CREATE POLICY "Anyone can upload" ON photos FOR INSERT WITH CHECK (true);
