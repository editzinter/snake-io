// Import supabase client
import { supabase } from './supabase.js';

// DOM elements - We'll initialize these later
let authContainer, gameContainer, authForm, toggleAuthButton, 
    playAsGuestButton, googleSignInButton, submitAuthButton, 
    logoutButton, authMessage, emailInput, passwordInput;

// Current auth state
let isLoginMode = true;
let currentUser = null;

// Function to safely get DOM elements
function initDOMElements() {
    authContainer = document.getElementById('auth-container');
    gameContainer = document.getElementById('game-container');
    authForm = document.getElementById('authForm');
    toggleAuthButton = document.getElementById('toggleAuth');
    playAsGuestButton = document.getElementById('playAsGuest');
    googleSignInButton = document.getElementById('googleSignIn');
    submitAuthButton = document.getElementById('submitAuth');
    logoutButton = document.getElementById('logout-button');
    authMessage = document.getElementById('authMessage');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');

    // Debug info
    console.log('Auth module loaded');
    console.log('DOM Elements:', {
        authContainer: !!authContainer,
        gameContainer: !!gameContainer,
        authForm: !!authForm,
        toggleAuthButton: !!toggleAuthButton,
        playAsGuestButton: !!playAsGuestButton,
        googleSignInButton: !!googleSignInButton,
        submitAuthButton: !!submitAuthButton,
        logoutButton: !!logoutButton,
        authMessage: !!authMessage,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput
    });
}

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
        console.log('Attempting sign up with email:', email);
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Signup requires a secure context (HTTPS or localhost)');
        }

        if (!supabase || !supabase.auth) {
            throw new Error('Supabase client not initialized properly');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) throw error;
        console.log('Sign up successful:', data.user);
        return data.user;
    } catch (error) {
        handleAuthError(error, 'An error occurred during sign up.');
        return null;
    }
}

// Login function
async function login(email, password) {
    try {
        console.log('Attempting login with email:', email);
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Login requires a secure context (HTTPS or localhost)');
        }

        if (!supabase || !supabase.auth) {
            throw new Error('Supabase client not initialized properly');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        console.log('Login successful:', data.user);
        return data.user;
    } catch (error) {
        handleAuthError(error, 'An error occurred during login.');
        return null;
    }
}

// Google sign in function
async function signInWithGoogle() {
    try {
        console.log('Attempting Google sign-in');
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            throw new Error('Google sign-in requires a secure context (HTTPS or localhost)');
        }

        if (!supabase || !supabase.auth) {
            throw new Error('Supabase client not initialized properly');
        }

        showAuthMessage('Connecting to Google...', 'info');
        
        // Get the current URL for the redirect
        const redirectUrl = window.location.origin;
        console.log('Redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });

        console.log('Google sign-in response:', data);
        
        if (error) throw error;
    } catch (error) {
        console.error('Google sign-in error:', error);
        handleAuthError(error, 'Failed to connect to Google.');
    }
}

// Logout function
async function logout() {
    try {
        console.log('Attempting logout');
        
        if (!supabase || !supabase.auth) {
            throw new Error('Supabase client not initialized properly');
        }
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('Logout successful');
        return true;
    } catch (error) {
        handleAuthError(error, 'Logout error');
        return false;
    }
}

// Check if user is logged in
async function checkUserSession() {
    try {
        console.log('Checking user session');
        
        if (!supabase || !supabase.auth) {
            console.warn('Supabase client not initialized properly for session check');
            return null;
        }
        
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const user = data && data.session && data.session.user ? data.session.user : null;
        console.log('Current user session:', user);
        return user;
    } catch (error) {
        handleAuthError(error, 'Session check error');
        return null;
    }
}

// Helper functions
function showAuthMessage(message, type = 'error') {
    if (!authMessage) return;
    
    console.log(`Auth message (${type}):`, message);
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    
    // Remove hidden class
    authMessage.classList.remove('hidden');
    
    // Clear message after 5 seconds
    setTimeout(() => {
        if (authMessage && authMessage.textContent === message) {
            authMessage.textContent = '';
            authMessage.className = 'auth-message hidden';
        }
    }, 5000);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    console.log('Toggling auth mode. Is login mode now:', isLoginMode);
    
    if (!submitAuthButton || !toggleAuthButton) return;
    
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
        console.error('Required containers not found for showing game container');
        return;
    }

    console.log('Showing game container for user:', user);
    currentUser = user;
    authContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // If user is logged in, attempt to get their saved profile
    if (user && user.id) {
        loadUserProfile(user.id).catch(error => {
            console.error('Error loading user profile:', error);
        });
    }
    
    console.log('Game container should be visible now');
}

async function loadUserProfile(userId) {
    try {
        console.log('Loading user profile for ID:', userId);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized properly');
        }
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        if (data) {
            console.log('User profile loaded:', data);
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
    console.log('Initializing auth event listeners');
    
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
                if (gameContainer && authContainer) {
                    gameContainer.classList.add('hidden');
                    authContainer.classList.remove('hidden');
                }
            }
        });
    }
}

// Initialize auth state
async function initAuth() {
    try {
        console.log('Initializing auth system');
        
        // Initialize DOM elements first
        initDOMElements();
        
        // Check for existing session
        const user = await checkUserSession();
        if (user) {
            showGameContainer(user);
        }
        
        // Set up auth state change listener
        if (supabase && supabase.auth) {
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session ? !!session.user : null);
                
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
        } else {
            console.warn('Supabase auth not available for auth state change listener');
        }

        // Initialize event listeners
        initEventListeners();
        console.log('Auth system initialized successfully');
    } catch (error) {
        console.error('Error during auth initialization:', error);
        handleAuthError(error, 'Error initializing auth');
    }
}

// Initialize when DOM is fully loaded using a safer approach
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initAuth, 100); // Small delay to ensure everything is loaded
    });
} else {
    setTimeout(initAuth, 100); // Small delay to ensure everything is loaded
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