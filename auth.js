import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB9TKLmKIVO7-YWKv1iORqnax0sru249sY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "legalmind-users.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "legalmind-users",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "legalmind-users.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "321034025311",
    appId: process.env.FIREBASE_APP_ID || "1:321034025311:web:d8a01ac0c02d5b152b1eea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, "MainAuth");
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Fix for Google Sign-In popup
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
auth.useDeviceLanguage();

// Set the domain for cookies and disable verification for testing
auth.settings.appVerificationDisabledForTesting = true;
provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: 'user@example.com'
});

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Login elements
    const loginForm = document.getElementById('login-content');
    const loginBtn = document.getElementById('login-button');
    const googleLoginBtn = document.getElementById('google-login');
    
    console.log("Login button found:", loginBtn ? "Yes" : "No");
    console.log("Google login button found:", googleLoginBtn ? "Yes" : "No");
    
    // Signup elements
    const signupForm = document.getElementById('signup-content');
    const signupBtn = document.getElementById('signup-button');
    const googleSignupBtn = document.getElementById('google-signup');
    
    // Logout element
    const logoutBtn = document.getElementById('logout');
    
    // Listen for custom events from inline handlers
    document.addEventListener('google-login-clicked', handleGoogleLogin);
    document.addEventListener('google-signup-clicked', handleGoogleSignup);
    
    // Email/Password Sign In
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Login button clicked in auth.js");
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert("Please enter both email and password");
                return;
            }
            
            console.log("Attempting to sign in with email and password");
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("User signed in successfully:", userCredential.user);
                    window.location.href = "temp3.html";
                })
                .catch((error) => {
                    console.error("Sign-in error:", error.message);
                    alert("Login failed: " + error.message);
                });
        });
    }
    
    // Email/Password Sign Up
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            
            if (!name || !email || !password) {
                alert("Please fill in all required fields");
                return;
            }
            
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Update profile with the name
                    return updateProfile(userCredential.user, {
                        displayName: name
                    }).then(() => {
                        // Save user data to Firestore
                        return setDoc(doc(db, "users", userCredential.user.uid), {
                            name: name,
                            email: email,
                            createdAt: new Date()
                        });
                    }).then(() => {
                        console.log("User created successfully:", userCredential.user);
                        window.location.href = "temp3.html";
                    });
                })
                .catch((error) => {
                    console.error("Sign-up error:", error.message);
                    alert("Sign-up failed: " + error.message);
                });
        });
    }
    
    // Google Sign-In function (called by the custom event)
    async function handleGoogleLogin() {
        console.log("Google login handler triggered");
        
        try {
            // First try the popup method
            const result = await signInWithPopup(auth, provider);
            console.log("Google login successful:", result.user);
            // Store a flag in localStorage to indicate user is logged in
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = "temp3.html";
        } catch (error) {
            console.error("Google login popup error:", error);
            
            // If popup is blocked or fails, try alternative approach
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
                try {
                    alert("Popup was blocked. Please allow popups for this site in your browser settings and try again.");
                } catch (redirectError) {
                    console.error("Redirect error:", redirectError);
                    alert("Google login failed. Please check your internet connection and try again.");
                }
            } else if (error.code !== 'auth/cancelled-popup-request') {
                alert("Google login failed: " + error.message);
            }
        }
    }
    
    // Google Sign-Up function (called by the custom event)
    async function handleGoogleSignup() {
        console.log("Google signup handler triggered");
        
        try {
            // First try the popup method
            const result = await signInWithPopup(auth, provider);
            console.log("Google signup successful:", result.user);
            // Store a flag in localStorage to indicate user is logged in
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = "temp3.html";
        } catch (error) {
            console.error("Google signup popup error:", error);
            
            // If popup is blocked or fails, try alternative approach
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
                try {
                    alert("Popup was blocked. Please allow popups for this site in your browser settings and try again.");
                } catch (redirectError) {
                    console.error("Redirect error:", redirectError);
                    alert("Google signup failed. Please check your internet connection and try again.");
                }
            } else if (error.code !== 'auth/cancelled-popup-request') {
                alert("Google signup failed: " + error.message);
            }
        }
    }
    
    // Google Sign-In (Login tab) - Keep as backup
    if (googleLoginBtn) {
        // Remove any existing click event listeners
        const newGoogleLoginBtn = googleLoginBtn.cloneNode(true);
        googleLoginBtn.parentNode.replaceChild(newGoogleLoginBtn, googleLoginBtn);
        
        newGoogleLoginBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("Google login clicked from event listener");
            handleGoogleLogin();
        });
    }
    
    // Google Sign-In (Signup tab) - Keep as backup
    if (googleSignupBtn) {
        // Remove any existing click event listeners
        const newGoogleSignupBtn = googleSignupBtn.cloneNode(true);
        googleSignupBtn.parentNode.replaceChild(newGoogleSignupBtn, googleSignupBtn);
        
        newGoogleSignupBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("Google signup clicked from event listener");
            handleGoogleSignup();
        });
    }

// Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                console.log("User signed out.");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Logout error:", error.message);
            });
        });
    }
});

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout");
    const logoutButtonProfile = document.getElementById("logoutButton");
    const profileUserName = document.getElementById("profileUserName");
    const profilePicNav = document.getElementById("profilePicNav");
    const navProfile = document.querySelector(".nav-profile");
    
    if (user) {
        // User is signed in
        console.log("User is logged in:", user.displayName);
        
        // Show/hide login/logout links
        if (loginLink) loginLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        
        // Show profile menu
        if (navProfile) navProfile.style.display = "block";
        
        // Set user name in profile menu
        if (profileUserName) {
            profileUserName.textContent = user.displayName || "User";
        }
        
        // Set profile picture if user has one
        if (profilePicNav) {
            if (user.photoURL) {
                profilePicNav.src = user.photoURL;
                // Also update the preview in settings if it exists
                const profilePreview = document.getElementById("profilePreview");
                if (profilePreview) {
                    profilePreview.src = user.photoURL;
                }
            } else {
                // Use initials or username for avatar if no photo
                const initials = user.displayName ? user.displayName.charAt(0) : "U";
                profilePicNav.src = `https://ui-avatars.com/api/?name=${initials}&background=random`;
            }
        }
    } else {
        // User is signed out
        console.log("User is logged out");
        
        // Show/hide login/logout links
        if (loginLink) loginLink.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "none";
        
        // Hide profile menu
        if (navProfile) navProfile.style.display = "none";
        
        // If on temp3.html page and not logged in, redirect to auth.html
        if (window.location.pathname.includes("temp3.html")) {
            window.location.href = "auth.html";
        }
    }
    
    // Setup logout button in profile menu (works on all pages)
    if (logoutButtonProfile) {
        // Remove any existing listeners
        const newLogoutBtn = logoutButtonProfile.cloneNode(true);
        logoutButtonProfile.parentNode.replaceChild(newLogoutBtn, logoutButtonProfile);
        
        newLogoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                console.log("User signed out from profile menu.");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Logout error:", error.message);
            });
        });
    }
});
