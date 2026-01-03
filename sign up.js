

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
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
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

const signUpForm = document.getElementById("signUpForm");

signUpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  let firstName = signUpForm.firstname.value;
  let lastName = signUpForm.lastname.value;
  let userName = signUpForm.username.value;
  let email = signUpForm.email.value;
  let password = signUpForm.password.value;
  let confirmPassword = signUpForm.confirmPassword.value;

  const errorDiv = document.getElementById('errorMessage');
  errorDiv.style.display = 'none';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!firstName || !lastName || !userName || !email || !password || !confirmPassword) {
    errorDiv.textContent = 'Please fill in all fields.';
    errorDiv.style.display = 'block';
    return;
  }

  if (!emailRegex.test(email)) {
    errorDiv.textContent = 'Please enter a valid email address (e.g., user@example.com).';
    errorDiv.style.display = 'block';
    return;
  }
  if (!passwordRegex.test(password)) {
    errorDiv.textContent = 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
    errorDiv.style.display = 'block';
    return;
  }

  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match. Please try again.';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);

    const userDocSnapShot = await addDoc(userColRef, {
      uid: userCredentials.user.uid,
      firstname: firstName,
      lastname: lastName,
      username: userName,
      email: email,
      password: password
    });
    console.log(userCredentials);
    console.log(userDocSnapShot);

    showToast('Sign up successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = './sign in.html';
    }, 1500);



  } catch (error) {
    console.log(error.message);

    const errorDiv = document.getElementById('errorMessage');

    if (error.message === 'Firebase: Error (auth/email-already-in-use).') {
      errorDiv.textContent = 'This email is already registered. Please sign in or use a different email.';
    } else if (error.code === 'auth/weak-password') {
      errorDiv.textContent = 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/invalid-email') {
      errorDiv.textContent = 'Please enter a valid email address.';
    } else {
      errorDiv.textContent = 'Sign up failed: ' + error.message;
    }

    errorDiv.style.display = 'block';

    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

})