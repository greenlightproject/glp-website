// Supabase project connection details for the GLP member portal.
// The anon/public key is safe to expose client-side — Row Level Security
// policies on each table are what actually protect the data.

const SUPABASE_URL = 'https://iaqcjnphaiuhiatrigzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcWNqbnBoYWl1aGlhdHJpZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzA4OTIsImV4cCI6MjEwNDEwNjg5Mn0.aR83KXrza78TTue6oNV9mcl6ojk3LEcKOQr1uCB2Css';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
