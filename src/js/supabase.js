// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded for production, environment variables for development
// NOTE: In production, these will be injected by Netlify environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://fqcvrfbaivbozlgqafw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY3ZyZmJhaXZib3psZ3FhZnciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzg5MzU5MiwiZXhwIjoyMDI5NDY5NTkyfQ.lWrETfMgHE9QMBHXgXvxY9qDd2bVszQa1E0xEQD9E_I';

// Check if we're in a secure context
const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (!isSecureContext) {
    console.warn('Warning: Running in an insecure context. Some authentication features may not work. Please use HTTPS or localhost.');
}

// Initialize Supabase client with additional options
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Log initialization
console.log('Supabase client initialized in module');

// Make it available globally for non-module scripts
if (typeof window !== 'undefined') {
    // Create a proxy to catch initialization errors
    const supabaseProxy = new Proxy(supabase, {
        get: function(target, prop) {
            if (prop === 'auth' && !isSecureContext) {
                console.error('Authentication features are not available in insecure contexts. Please use HTTPS or localhost.');
            }
            return target[prop];
        }
    });

    window.supabaseModule = supabaseProxy;
    
    // Check if global supabase is not already initialized
    if (!window.supabase) {
        window.supabase = supabaseProxy;
        console.log('Supabase also exposed globally from module');
    }
}

// Export for use in other files
export { supabase }; 