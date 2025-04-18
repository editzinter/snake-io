// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded for production, environment variables for development
// NOTE: In production, these will be injected by Netlify environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://fqcvrfbaivbozlgqafw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY3ZyZmJhaXZib3psZ3FhZnciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzg5MzU5MiwiZXhwIjoyMDI5NDY5NTkyfQ.lWrETfMgHE9QMBHXgXvxY9qDd2bVszQa1E0xEQD9E_I';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized in module');

// Also make it available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.supabaseModule = supabase;
    
    // Check if global supabase is not already initialized
    if (!window.supabase) {
        window.supabase = supabase;
        console.log('Supabase also exposed globally from module');
    }
}

// Export for use in other files
export { supabase }; 