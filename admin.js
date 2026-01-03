 import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
        import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyBYcniy1kKaqs8qpSZUwnnBdsT3eT2RpyE",
            authDomain: "reelbox-d6dc5.firebaseapp.com",
            projectId: "reelbox-d6dc5",
            storageBag: "reelbox-d6dc5.firebasestorage.app",
            messagingSenderId: "939785754208",
            appId: "1:939785754208:web:b90db321678e948ed3d505"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore();

        const form = document.getElementById('addMovieForm');
        const successMessage = document.getElementById('successMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const movieData = {
                title: document.getElementById('title').value,
                poster: document.getElementById('poster').value,
                videoUrl: document.getElementById('videoUrl').value,
                description: document.getElementById('description').value,
                rating: parseFloat(document.getElementById('rating').value),
                genre: document.getElementById('genre').value,
                year: parseInt(document.getElementById('year').value),
                duration: document.getElementById('duration').value,
                createdAt: new Date()
            };

            try {
                await addDoc(collection(db, "movies"), movieData);
                successMessage.style.display = 'block';
                form.reset();
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            } catch (error) {
                console.error("Error adding movie:", error);
                alert("Error adding movie: " + error.message);
            }
        });