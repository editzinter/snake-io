// Standalone Google auth script (no ES modules)
(function() {
    // Hardcoded Supabase credentials - Fixed URL typo
    const supabaseUrl = 'https://fqcvrfbaivbozlgqafw.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY3ZyZmJhaXZib3psZ3FhZnciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzg5MzU5MiwiZXhwIjoyMDI5NDY5NTkyfQ.lWrETfMgHE9QMBHXgXvxY9qDd2bVszQa1E0xEQD9E_I';

    // Initialize helper functions
    function showAuthMessage(message) {
        const authMessage = document.getElementById('auth-message');
        if (authMessage) {
            authMessage.textContent = message;
            setTimeout(() => {
                authMessage.textContent = '';
            }, 5000);
        }
    }

    function showGameContainer() {
        const authContainer = document.getElementById('auth-container');
        const gameContainer = document.getElementById('game-container');
        
        if (authContainer && gameContainer) {
            authContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');
        }
    }

    // Function to sign in with Google
    window.googleSignIn = function() {
        try {
            showAuthMessage('Connecting to Google...');
            
            // Get the Supabase client from the global object
            if (window.supabase && window.supabase.auth) {
                // Use the global Supabase instance that was loaded in the HTML
                const supabaseClient = window.supabase;
                
                // Always use the Netlify URL for redirects
                const redirectUrl = 'https://snake-io-editzinter.netlify.app';
                
                supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl
                    }
                });
            } else {
                showAuthMessage('Supabase client not available. Please try again later.');
                console.error('Supabase client not found in window object.');
            }
        } catch (error) {
            showAuthMessage('Failed to connect to Google. Please try again.');
            console.error('Google sign-in error:', error);
        }
    };

    // Initialize the button when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        const googleSignInButton = document.getElementById('google-signin');
        if (googleSignInButton) {
            googleSignInButton.addEventListener('click', window.googleSignIn);
        }
    });

    // Handle OAuth redirects
    async function handleAuthRedirect() {
        try {
            if (window.supabase && window.supabase.auth) {
                const supabaseClient = window.supabase;
                
                const { data } = await supabaseClient.auth.getSession();
                
                if (data && data.session) {
                    showGameContainer();
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    // Check for redirects when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        handleAuthRedirect();
    });
})(); 