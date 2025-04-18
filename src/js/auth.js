// Import supabase client
import { supabase } from './supabase.js';

// DOM elements
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const toggleAuthButton = document.getElementById('toggle-auth');
const guestPlayButton = document.getElementById('guest-play');
const logoutButton = document.getElementById('logout-button');
const authMessage = document.getElementById('auth-message');

// Current auth state
let isLoginMode = false;
let currentUser = null;

// Sign up function
async function signUp(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            showAuthMessage(error.message);
            return null;
        }

        return data.user;
    } catch (error) {
        showAuthMessage('An error occurred during sign up.');
        console.error('Sign up error:', error);
        return null;
    }
}

// Login function
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showAuthMessage(error.message);
            return null;
        }

        return data.user;
    } catch (error) {
        showAuthMessage('An error occurred during login.');
        console.error('Login error:', error);
        return null;
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

// Check if user is logged in
async function checkUserSession() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        
        if (data && data.session) {
            return data.session.user;
        }
        
        return null;
    } catch (error) {
        console.error('Session check error:', error);
        return null;
    }
}

// Helper functions
function showAuthMessage(message) {
    authMessage.textContent = message;
    setTimeout(() => {
        authMessage.textContent = '';
    }, 5000);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
        toggleAuthButton.textContent = 'Switch to Sign Up';
    } else {
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
        toggleAuthButton.textContent = 'Switch to Login';
    }
}

function showGameContainer(user) {
    currentUser = user;
    authContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // If user is logged in, attempt to get their saved profile
    if (user && user.id) {
        loadUserProfile(user.id);
    }
}

async function loadUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) {
            console.error('Error loading profile:', error);
            return;
        }
        
        if (data) {
            // Populate player name input with saved name if available
            document.getElementById('playerName').value = data.username || '';
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Event listeners
document.getElementById('signup-button').addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (!email || !password) {
        showAuthMessage('Please enter email and password.');
        return;
    }
    
    const user = await signUp(email, password);
    if (user) {
        showAuthMessage('Sign up successful! Please check your email to verify your account.');
        toggleAuthMode(); // Switch to login
    }
});

document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthMessage('Please enter email and password.');
        return;
    }
    
    const user = await login(email, password);
    if (user) {
        showGameContainer(user);
    }
});

toggleAuthButton.addEventListener('click', toggleAuthMode);

guestPlayButton.addEventListener('click', () => {
    showGameContainer(null); // Play as guest
});

logoutButton.addEventListener('click', async () => {
    const success = await logout();
    if (success) {
        currentUser = null;
        gameContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    }
});

// Check session on page load
window.addEventListener('DOMContentLoaded', async () => {
    const user = await checkUserSession();
    if (user) {
        showGameContainer(user);
    }
});

// Export user-related functions for use in game.js
export { currentUser, saveHighScore }; 

// Function to save user high score
async function saveHighScore(score) {
    if (!currentUser) return false;
    
    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('highscores')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
            console.error('Error fetching existing score:', fetchError);
            return false;
        }
        
        // Only update if new score is higher or no previous score exists
        if (!existingData || score > existingData.score) {
            const { error: upsertError } = await supabase
                .from('highscores')
                .upsert({ 
                    user_id: currentUser.id,
                    score: score,
                    username: document.getElementById('playerName').value || 'Anonymous'
                });
                
            if (upsertError) {
                console.error('Error saving score:', upsertError);
                return false;
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('High score save error:', error);
        return false;
    }
} 