// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded for production
const supabaseUrl = 'https://fqcvrfbaivbozlgqafw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY3ZyZmJhaXZib3psZ3FhZnciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzg5MzU5MiwiZXhwIjoyMDI5NDY5NTkyfQ.lWrETfMgHE9QMBHXgXvxY9qDd2bVszQa1E0xEQD9E_I';

// Debug configuration
console.log('Supabase configuration:', { 
    url: supabaseUrl,
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

// Check if we're in a secure context
const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log('Is secure context:', isSecureContext, 'Hostname:', window.location.hostname);

if (!isSecureContext) {
    console.warn('Warning: Running in an insecure context. Some authentication features may not work. Please use HTTPS or localhost.');
}

// Initialize Supabase client with additional options
let supabase;
try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or key is undefined');
    }
    
    // Create a wrapper for the real client that adds safety checks
    const realClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    
    // Create a proxy that adds null-safe handling
    supabase = new Proxy(realClient, {
        get: function(target, prop) {
            // Special handling for auth operations
            if (prop === 'auth') {
                const authTarget = target.auth;
                if (!authTarget) {
                    console.error('Auth is undefined on Supabase client');
                    return {
                        signUp: () => ({ error: { message: 'Auth is undefined on Supabase client' } }),
                        signInWithPassword: () => ({ error: { message: 'Auth is undefined on Supabase client' } }),
                        signInWithOAuth: () => ({ error: { message: 'Auth is undefined on Supabase client' } }),
                        signOut: () => ({ error: { message: 'Auth is undefined on Supabase client' } }),
                        getSession: () => ({ error: { message: 'Auth is undefined on Supabase client' } }),
                        onAuthStateChange: () => {}
                    };
                }
                
                // Return a proxy for auth methods to handle undefined results
                return new Proxy(authTarget, {
                    get: function(authObj, method) {
                        const original = authObj[method];
                        
                        // If it's not a function, just return it
                        if (typeof original !== 'function') {
                            return original;
                        }
                        
                        // Return wrapped function with extra safety
                        return function(...args) {
                            try {
                                console.log(`Calling auth.${method}() with:`, ...args);
                                const result = original.apply(authObj, args);
                                
                                // Handle Promise results from auth methods
                                if (result instanceof Promise) {
                                    return result
                                        .then(response => {
                                            console.log(`Result from auth.${method}():`, response);
                                            return response;
                                        })
                                        .catch(error => {
                                            console.error(`Error in auth.${method}():`, error);
                                            return { data: null, error };
                                        });
                                }
                                
                                return result;
                            } catch (error) {
                                console.error(`Exception in auth.${method}():`, error);
                                return { data: null, error };
                            }
                        };
                    }
                });
            }
            
            return target[prop];
        }
    });
    
    // Test that supabase was initialized correctly
    if (!supabase || !supabase.auth) {
        throw new Error('Supabase client was not initialized correctly');
    }
    
    console.log('Supabase client initialized successfully in module');
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Create a fallback client to avoid breaking the app
    supabase = {
        auth: {
            signUp: () => ({ error: { message: 'Supabase client initialization failed' } }),
            signInWithPassword: () => ({ error: { message: 'Supabase client initialization failed' } }),
            signInWithOAuth: () => ({ error: { message: 'Supabase client initialization failed' } }),
            signOut: () => ({ error: { message: 'Supabase client initialization failed' } }),
            getSession: () => ({ error: { message: 'Supabase client initialization failed' } }),
            onAuthStateChange: () => {}
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => ({ error: { message: 'Supabase client initialization failed' } })
                })
            })
        })
    };
}

// Make it available globally for non-module scripts
if (typeof window !== 'undefined') {
    try {
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
        
        // We no longer set window.supabase here since we removed the CDN version
        // and we rely on the ES module system
        
        console.log('Supabase exposed as window.supabaseModule');
    } catch (error) {
        console.error('Error making Supabase available globally:', error);
    }
}

// Export for use in other files
export { supabase }; 