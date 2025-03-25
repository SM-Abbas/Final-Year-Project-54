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
    apiKey: "AIzaSyB9TKLmKIVO7-YWKv1iORqnax0sru249sY",
    authDomain: "legalmind-users.firebaseapp.com",
    projectId: "legalmind-users",
    storageBucket: "legalmind-users.firebasestorage.app",
    messagingSenderId: "321034025311",
    appId: "1:321034025311:web:d8a01ac0c02d5b152b1eea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Login elements
    const loginForm = document.getElementById('login-content');
    const loginBtn = document.querySelector('#login-content button');
    const googleLoginBtn = document.getElementById('google-login');
    
    // Signup elements
    const signupForm = document.getElementById('signup-content');
    const signupBtn = document.querySelector('#signup-content button');
    const googleSignupBtn = document.getElementById('google-signup');
    
    // Logout element
    const logoutBtn = document.getElementById('logout');
    
    // Email/Password Sign In
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert("Please enter both email and password");
                return;
            }
            
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("User signed in:", userCredential.user);
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
                        alert("Account created successfully!");
                        window.location.href = "temp3.html";
                    });
                })
                .catch((error) => {
                    console.error("Sign-up error:", error.message);
                    alert("Sign-up failed: " + error.message);
                });
        });
    }
    
    // Google Sign-In (Login tab)
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener("click", () => {
            signInWithPopup(auth, provider)
                .then(async (result) => {
                    const user = result.user;
                    await setDoc(doc(db, "users", user.uid), {
                        name: user.displayName,
                        email: user.email,
                        profilePic: user.photoURL,
                        lastLogin: new Date()
                    });
                    console.log("User signed in:", user);
                    window.location.href = "temp3.html";
                })
                .catch((error) => {
                    console.error("Google login error:", error.message);
                    alert("Google sign-in failed: " + error.message);
                });
        });
    }
    
    // Google Sign-In (Signup tab)
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener("click", () => {
            signInWithPopup(auth, provider)
                .then(async (result) => {
                    const user = result.user;
                    await setDoc(doc(db, "users", user.uid), {
                        name: user.displayName,
                        email: user.email,
                        profilePic: user.photoURL,
                        createdAt: new Date()
                    });
                    console.log("User signed up:", user);
                    window.location.href = "temp3.html";
                })
                .catch((error) => {
                    console.error("Google signup error:", error.message);
                    alert("Google sign-up failed: " + error.message);
                });
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
    
    if (user) {
        // User is signed in
        console.log("User is logged in:", user.displayName);
        if (loginLink) loginLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        
        // Set user name in profile menu if we're on the temp3.html page
        const profileMenuName = document.querySelector(".profile-menu p strong");
        if (profileMenuName) {
            profileMenuName.textContent = user.displayName || "User";
        }
    } else {
        // User is signed out
        console.log("User is logged out");
        if (loginLink) loginLink.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }
    
    // Setup logout button in profile menu (temp3.html)
    if (logoutButtonProfile) {
        logoutButtonProfile.addEventListener("click", () => {
            signOut(auth).then(() => {
                console.log("User signed out from profile menu.");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Logout error:", error.message);
            });
        });
    }
});
