// Import supabase client
import { supabase } from './supabase.js';

// DOM elements
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const authForm = document.getElementById('authForm');
const toggleAuthButton = document.getElementById('toggleAuth');
const playAsGuestButton = document.getElementById('playAsGuest');
const googleSignInButton = document.getElementById('googleSignIn');
const submitAuthButton = document.getElementById('submitAuth');
const logoutButton = document.getElementById('logout-button');
const authMessage = document.getElementById('authMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Current auth state
let isLoginMode = true;
let currentUser = null;

// Error handling utility
function handleAuthError(error, defaultMessage = 'An error occurred') {
    console.error('Auth error:', error);
    
    // Check for specific error types
    if (error && error.message && error.message.includes('digest')) {
        showAuthMessage('This site requires HTTPS or localhost for security features. Please use a secure connection.');
        return;
    }
    
    if (error && error.message && error.message.includes('rate limit')) {
        showAuthMessage('Too many attempts. Please wait a moment and try again.');
        return;
    }
    
    showAuthMessage(error && error.message ? error.message : defaultMessage);
}

// Sign up function
async function signUp(email, password) {
    try {
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Signup requires a secure context (HTTPS or localhost)');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return data.user;
    } catch (error) {
        handleAuthError(error, 'An error occurred during sign up.');
        return null;
    }
}

// Login function
async function login(email, password) {
    try {
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Login requires a secure context (HTTPS or localhost)');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data.user;
    } catch (error) {
        handleAuthError(error, 'An error occurred during login.');
        return null;
    }
}

// Google sign in function
async function signInWithGoogle() {
    try {
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Google sign-in requires a secure context (HTTPS or localhost)');
        }

        showAuthMessage('Connecting to Google...');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
    } catch (error) {
        handleAuthError(error, 'Failed to connect to Google.');
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
    } catch (error) {
        handleAuthError(error, 'Logout error');
        return false;
    }
}

// Check if user is logged in
async function checkUserSession() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data && data.session && data.session.user ? data.session.user : null;
    } catch (error) {
        handleAuthError(error, 'Session check error');
        return null;
    }
}

// Helper functions
function showAuthMessage(message, type = 'error') {
    if (!authMessage) return;
    
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    
    // Remove hidden class
    authMessage.classList.remove('hidden');
    
    // Clear message after 5 seconds
    setTimeout(() => {
        if (authMessage.textContent === message) {
            authMessage.textContent = '';
            authMessage.className = 'auth-message hidden';
        }
    }, 5000);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        submitAuthButton.textContent = 'Sign In';
        toggleAuthButton.textContent = 'Switch to Sign Up';
    } else {
        submitAuthButton.textContent = 'Sign Up';
        toggleAuthButton.textContent = 'Switch to Sign In';
    }
}

// Play as guest function - doesn't require Supabase
function playAsGuest() {
    console.log('Play as Guest clicked from auth.js');
    showGameContainer(null);
    return false; // Prevent default form submission
}

function showGameContainer(user) {
    if (!authContainer || !gameContainer) {
        console.error('Required containers not found');
        return;
    }

    currentUser = user;
    authContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // If user is logged in, attempt to get their saved profile
    if (user && user.id) {
        loadUserProfile(user.id).catch(console.error);
    }
    
    console.log('Game container should be visible now');
}

async function loadUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        if (data) {
            const playerNameInput = document.getElementById('playerName');
            if (playerNameInput) {
                playerNameInput.value = data.username || '';
            }
        }
    } catch (error) {
        handleAuthError(error, 'Profile load error');
    }
}

// Function to initialize all event listeners
function initEventListeners() {
    // Auth form submission
    if (authForm) {
        authForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = emailInput && emailInput.value;
            const password = passwordInput && passwordInput.value;
            
            if (!email || !password) {
                showAuthMessage('Please enter email and password.');
                return;
            }
            
            if (isLoginMode) {
                const user = await login(email, password);
                if (user) {
                    showGameContainer(user);
                }
            } else {
                const user = await signUp(email, password);
                if (user) {
                    showAuthMessage('Sign up successful! Please check your email to verify your account.', 'success');
                    toggleAuthMode(); // Switch to login
                }
            }
        });
    }

    // Toggle auth mode button
    if (toggleAuthButton) {
        toggleAuthButton.addEventListener('click', toggleAuthMode);
    }

    // Google sign-in button
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', signInWithGoogle);
    }

    // Guest play button
    if (playAsGuestButton) {
        playAsGuestButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Guest play button clicked from auth.js event listener');
            playAsGuest();
        });
    }

    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const success = await logout();
            if (success) {
                currentUser = null;
                gameContainer.classList.add('hidden');
                authContainer.classList.remove('hidden');
            }
        });
    }
}

// Initialize auth state
async function initAuth() {
    try {
        // Check for existing session
        const user = await checkUserSession();
        if (user) {
            showGameContainer(user);
        }
        
        // Set up auth state change listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session && session.user) {
                showGameContainer(session.user);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                if (gameContainer && authContainer) {
                    gameContainer.classList.add('hidden');
                    authContainer.classList.remove('hidden');
                }
            }
        });

        // Initialize event listeners
        initEventListeners();
    } catch (error) {
        handleAuthError(error, 'Error initializing auth');
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Export necessary functions
export {
    signUp,
    login,
    signInWithGoogle,
    logout,
    playAsGuest,
    showGameContainer
}; 