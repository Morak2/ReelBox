function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYcniy1kKaqs8qpSZUwnnBdsT3eT2RpyE",
    authDomain: "reelbox-d6dc5.firebaseapp.com",
    projectId: "reelbox-d6dc5",
    storageBucket: "reelbox-d6dc5.firebasestorage.app",
    messagingSenderId: "939785754208",
    appId: "1:939785754208:web:b90db321678e948ed3d505"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();

const db = getFirestore();

const userColRef = collection(db, "users");


const signInForm = document.getElementById("signInForm");
const errorMessage = document.getElementById("errorMessage");
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = signInForm.email.value;
    
    if (!email) {
        errorMessage.textContent = 'Please enter your email address first';
        errorMessage.style.display = 'block';
        showToast('Please enter your email address', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        errorMessage.style.display = 'block';
        showToast('Invalid email format', 'error');
        return;
    }
    
    try {
        // First check if email exists in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            errorMessage.textContent = 'No account found with this email address';
            errorMessage.style.display = 'block';
            showToast('No account found with this email', 'error');
            return;
        }
        
        // Email exists, send reset link
        await sendPasswordResetEmail(auth, email);
        errorMessage.style.display = 'none';
        showToast('Password reset email sent! Check your inbox.', 'success');
        
    } catch (error) {
        console.log(error.message);
        
        let errorText = "Failed to send reset email.";
        
        if (error.code === 'auth/user-not-found') {
            errorText = "No account found with this email.";
        } else if (error.code === 'auth/invalid-email') {
            errorText = "Invalid email address.";
        } else if (error.code === 'auth/too-many-requests') {
            errorText = "Too many requests. Please try again later.";
        }
        
        errorMessage.textContent = errorText;
        errorMessage.style.display = 'block';
        showToast(errorText, 'error');
    }
});



signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    let email = signInForm.email.value;
    let password = signInForm.password.value;

    try {
        const userResponse = await signInWithEmailAndPassword(auth, email, password);

        showToast('Sign In successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = './Dashboard.html';
        }, 1500);

   } catch (error) {
        console.log(error.message);

        let errorText = "An error occurred. Please try again.";

        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            errorText = "Invalid email or password. Please try again.";
        } else if (error.code === 'auth/user-not-found') {
            errorText = "No account found with this email.";
        } else if (error.code === 'auth/too-many-requests') {
            errorText = "Too many failed attempts. Please try again later.";
        } else if (error.code === 'auth/network-request-failed') {
            errorText = "Network error. Please check your connection.";
        } else if (error.code === 'auth/invalid-email') {
            errorText = "Invalid email format.";
        }

        errorMessage.textContent = errorText;
        errorMessage.style.display = 'block';
        showToast(errorText, 'error');
    }
})