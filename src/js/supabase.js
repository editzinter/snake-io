// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Add environment variable loading with fallbacks
const getEnvVariable = (key, fallback) => {
  try {
    // Try different ways to access environment variables
    return (
      // Browser environment with import.meta
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) ||
      // Node/webpack environment
      (typeof process !== 'undefined' && process.env && process.env[key]) ||
      // Fallback to provided value
      fallback
    );
  } catch (error) {
    console.warn(`Failed to load environment variable ${key}:`, error);
    return fallback;
  }
};

// Supabase configuration - with fallbacks
const supabaseUrl = getEnvVariable('SUPABASE_URL', 'https://fqcvrfbaivbozlgqafw.supabase.co');
const supabaseAnonKey = getEnvVariable('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY3ZyZmJhaXZib3psZ3FhZnciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzg5MzU5MiwiZXhwIjoyMDI5NDY5NTkyfQ.lWrETfMgHE9QMBHXgXvxY9qDd2bVszQa1E0xEQD9E_I');

// Debug configuration
console.log('%c Supabase Config:', 'background: #3ECF8E; color: white; padding: 3px; border-radius: 3px;', { 
    url: supabaseUrl,
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

// Check if we're in a secure context
const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log('Is secure context:', isSecureContext, 'Hostname:', window.location.hostname);

if (!isSecureContext) {
    console.warn('Warning: Running in an insecure context. Some authentication features may not work. Please use HTTPS or localhost.');
}

// Initialize Supabase client with additional options and even more robust error handling
let supabase;
try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or key is undefined');
    }
    
    // Create a reliable client creation function
    const createReliableClient = () => {
        try {
            return createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    // Fallbacks for common errors
                    storageKey: 'supabase.auth.token',
                    storage: window.localStorage
                }
            });
        } catch (error) {
            console.error('Error creating Supabase client:', error);
            return null;
        }
    };
    
    // Create the real client
    const realClient = createReliableClient();
    if (!realClient) {
        throw new Error('Failed to create Supabase client');
    }
    
    // Helper to safely handle Supabase method calls
    const safeMethod = (obj, method, fallbackValue = null) => {
        try {
            if (typeof obj[method] !== 'function') {
                console.warn(`Supabase client method ${method} is not a function`);
                return () => fallbackValue;
            }
            
            // Return a wrapped function that catches errors
            return function(...args) {
                try {
                    if (window.debugHelper) {
                        window.debugHelper.logInfo('Supabase', `Calling ${method} with: ${JSON.stringify(args)}`);
                    } else {
                        console.log(`Calling ${method} with:`, args);
                    }
                    
                    const result = obj[method].apply(obj, args);
                    
                    // Handle Promise results
                    if (result instanceof Promise || (result && typeof result.then === 'function')) {
                        return result
                            .then(response => {
                                if (response?.error) {
                                    console.warn(`Warning in ${method}:`, response.error);
                                } else {
                                    console.log(`Success from ${method}:`, response);
                                }
                                return response;
                            })
                            .catch(error => {
                                console.error(`Error in ${method}:`, error);
                                // Return a structured error to avoid undefined
                                return { data: null, error: { message: error?.message || 'Unknown error', originalError: error } };
                            });
                    }
                    
                    return result;
                } catch (error) {
                    console.error(`Exception in ${method}:`, error);
                    return fallbackValue;
                }
            };
        } catch (error) {
            console.error(`Error creating safe method for ${method}:`, error);
            return () => fallbackValue;
        }
    };
    
    // Create a robust auth proxy
    const createSafeAuthProxy = (authTarget) => {
        if (!authTarget) {
            console.error('Auth target is undefined');
            return createFallbackAuth();
        }
        
        try {
            return new Proxy(authTarget, {
                get: function(target, prop) {
                    const original = target[prop];
                    
                    // For non-functions, just return the property
                    if (typeof original !== 'function') {
                        return original;
                    }
                    
                    // For functions, wrap them with error handling
                    return safeMethod(target, prop, { error: { message: `Auth method ${prop} failed` } });
                }
            });
        } catch (error) {
            console.error('Error creating auth proxy:', error);
            return createFallbackAuth();
        }
    };
    
    // Create fallback auth object
    const createFallbackAuth = () => {
        return {
            signUp: () => Promise.resolve({ data: null, error: { message: 'Auth unavailable' } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Auth unavailable' } }),
            signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Auth unavailable' } }),
            signOut: () => Promise.resolve({ error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        };
    };
    
    // Create a main proxy for the entire client
    supabase = new Proxy(realClient, {
        get: function(target, prop) {
            try {
                // Special handling for auth to add extra safety
                if (prop === 'auth') {
                    return createSafeAuthProxy(target.auth);
                }
                
                // If the property doesn't exist, log and return a safe fallback
                if (!(prop in target)) {
                    console.warn(`Property ${prop} does not exist on Supabase client`);
                    return undefined;
                }
                
                // For methods, add error handling
                if (typeof target[prop] === 'function') {
                    return safeMethod(target, prop);
                }
                
                // For other properties, return as is
                return target[prop];
            } catch (error) {
                console.error(`Error accessing Supabase property ${String(prop)}:`, error);
                return undefined;
            }
        }
    });
    
    // Verify the proxy was created correctly
    if (!supabase || typeof supabase !== 'object') {
        throw new Error('Supabase proxy was not created correctly');
    }
    
    console.log('%c Supabase client initialized successfully', 'background: #3ECF8E; color: white; padding: 3px; border-radius: 3px;');
} catch (error) {
    // Handle initialization failure
    console.error('%c Supabase initialization failed:', 'background: #d32f2f; color: white; padding: 3px; border-radius: 3px;', error);
    
    // Create a comprehensive fallback client with promise-based returns
    const createFallbackMethod = (methodName) => {
        return function() {
            console.warn(`Using fallback for ${methodName} after initialization failure`);
            return Promise.resolve({ 
                data: null, 
                error: { 
                    message: `Supabase client initialization failed`, 
                    originalError: error
                } 
            });
        };
    };
    
    // Create a full fallback client structure
    supabase = {
        auth: {
            signUp: createFallbackMethod('auth.signUp'),
            signInWithPassword: createFallbackMethod('auth.signInWithPassword'),
            signInWithOAuth: createFallbackMethod('auth.signInWithOAuth'),
            signOut: createFallbackMethod('auth.signOut'),
            getSession: createFallbackMethod('auth.getSession'),
            getUser: createFallbackMethod('auth.getUser'),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        from: (table) => {
            console.warn(`Using fallback for database operations on ${table}`);
            return {
                select: () => ({
                    order: () => ({
                        limit: () => createFallbackMethod(`from(${table}).select.order.limit`)()
                    }),
                    eq: () => ({
                        single: () => createFallbackMethod(`from(${table}).select.eq.single`)()
                    })
                }),
                insert: () => createFallbackMethod(`from(${table}).insert`)(),
                update: () => ({
                    eq: () => createFallbackMethod(`from(${table}).update.eq`)()
                }),
                delete: () => ({
                    eq: () => createFallbackMethod(`from(${table}).delete.eq`)()
                })
            };
        }
    };
}

// Make it available globally for non-module scripts
if (typeof window !== 'undefined') {
    try {
        // Create a proxy that handles insecure contexts
        const supabaseGlobalProxy = new Proxy(supabase, {
            get: function(target, prop) {
                if (prop === 'auth' && !isSecureContext) {
                    console.error('Authentication features are not available in insecure contexts. Please use HTTPS or localhost.');
                }
                return target[prop];
            }
        });

        // Expose globally with a clear name
        window.supabaseModule = supabaseGlobalProxy;
        
        console.log('Supabase exposed as window.supabaseModule');
    } catch (error) {
        console.error('Error making Supabase available globally:', error);
    }
}

// Export for use in other modules
export { supabase }; 