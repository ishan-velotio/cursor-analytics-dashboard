-- Cursor Analytics Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- For now, allowing all operations for development
CREATE POLICY "Allow all operations on teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on team_members" ON public.team_members FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample teams (matching your existing file structure)
INSERT INTO public.teams (name) VALUES 
('frontend'),
('backend'),
('devops'),
('mobile'),
('qa'),
('management'),
('televox')
ON CONFLICT (name) DO NOTHING;

-- Sample team members (you'll update these with your actual data)
-- Note: Add your actual team members after running the migration script 