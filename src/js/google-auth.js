// Standalone Google auth script (no ES modules)
(function() {
    // Hardcoded Supabase credentials
    const supabaseUrl = 'https://fqcvqffbaivbozlgqafw.supabase.co';
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
    window.googleSignIn = async function() {
        try {
            showAuthMessage('Connecting to Google...');
            
            // Create a Supabase instance
            const { createClient } = supabase;
            const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
            
            // Always use the Netlify URL for redirects
            const redirectUrl = 'https://snake-io-editzinter.netlify.app';
            
            await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });
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
            const { createClient } = supabase;
            const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
            
            const { data } = await supabaseClient.auth.getSession();
            
            if (data && data.session) {
                showGameContainer();
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