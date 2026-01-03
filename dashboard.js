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

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYcniy1kKaqs8qpSZUwnnBdsT3eT2RpyE",
    authDomain: "reelbox-d6dc5.firebaseapp.com",
    projectId: "reelbox-d6dc5",
    storageBucket: "reelbox-d6dc5.firebasestorage.app",
    messagingSenderId: "939785754208",
    appId: "1:939785754208:web:b90db321678e948ed3d505"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

let selectedImageData = null;
let currentUserUid = null;
let currentSection = 'home';
let userWatchlist = [];
let allMovies = []; // Store all movies for search

// Get elements after DOM loads
let signOutBtn, profileIcon, userNameSpan, profileDropdown, updateProfileBtn, dropdownUsername, dropdownEmail;
let modal, closeModalBtn, cancelBtn, saveBtn, removeBtn, fileInput, profilePreview;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    signOutBtn = document.getElementById('signOutBtn');
    profileIcon = document.getElementById('profileIcon');
    userNameSpan = document.getElementById('userName');
    profileDropdown = document.getElementById('profileDropdown');
    updateProfileBtn = document.getElementById('updateProfileBtn');
    dropdownUsername = document.getElementById('dropdownUsername');
    dropdownEmail = document.getElementById('dropdownEmail');
    modal = document.getElementById('profileModal');
    closeModalBtn = document.querySelector('.close-profile');
    cancelBtn = document.getElementById('cancelModal');
    saveBtn = document.getElementById('saveProfilePic');
    removeBtn = document.getElementById('removeProfilePic');
    fileInput = document.getElementById('profileImageInput');
    profilePreview = document.getElementById('profilePreview');

    // Dropdown toggle
    if (profileIcon) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileDropdown.style.display === 'none' || !profileDropdown.style.display) {
                profileDropdown.style.display = 'block';
            } else {
                profileDropdown.style.display = 'none';
            }
        });
    }

    // Open modal
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            modal.style.display = 'block';
        });
    }

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // File input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showToast('Image too large! Max 2MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedImageData = event.target.result;
                    profilePreview.innerHTML = `<img src="${selectedImageData}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save picture
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!selectedImageData || !currentUserUid) {
                showToast('Please select an image', 'error');
                return;
            }

            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', currentUserUid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userDocRef = doc(db, 'users', userDoc.id);
                    
                    await updateDoc(userDocRef, {
                        profilePicture: selectedImageData
                    });
                    
                    profileIcon.innerHTML = `<img src="${selectedImageData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                    modal.style.display = 'none';
                    showToast('Picture saved!', 'success');
                } else {
                    showToast('User document not found', 'error');
                }
            } catch (error) {
                console.error('Error saving picture:', error);
                showToast('Failed to save', 'error');
            }
        });
    }

    // Remove picture
    if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
            if (!currentUserUid) return;

            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', currentUserUid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userDocRef = doc(db, 'users', userDoc.id);
                    
                    await updateDoc(userDocRef, {
                        profilePicture: null
                    });
                    
                    const username = userNameSpan.textContent;
                    profileIcon.innerHTML = `<span>${username.charAt(0).toUpperCase()}</span>`;
                    profilePreview.innerHTML = '<span style="font-size:60px; color:#ccc;">?</span>';
                    selectedImageData = null;
                    fileInput.value = '';
                    modal.style.display = 'none';
                    showToast('Picture removed', 'success');
                }
            } catch (error) {
                console.error('Error removing picture:', error);
                showToast('Failed to remove', 'error');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (profileIcon && profileDropdown && !profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });

    // Sign out
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showToast('Sign Out successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 1500);
            } catch (error) {
                console.log(error.message);
            }
        });
    }

    // Navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            currentSection = link.dataset.section;
            const titles = {
                home: 'All Movies',
                trending: 'Trending Movies',
                watchlist: 'My Watchlist'
            };
            const sectionTitle = document.getElementById('sectionTitle');
            if (sectionTitle) sectionTitle.textContent = titles[currentSection];
            loadMovies();
        });
    });

    // Movie Modal controls
    const movieModal = document.getElementById('movieModal');
    const closeMovieBtn = document.querySelector('.close-movie');

    if (closeMovieBtn) {
        closeMovieBtn.addEventListener('click', () => {
            if (movieModal) movieModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim().toLowerCase();
            
            if (query.length === 0) {
                displayMovies(allMovies);
                return;
            }

            searchTimeout = setTimeout(() => {
                const filteredMovies = allMovies.filter(movie => 
                    movie.title.toLowerCase().includes(query) ||
                    (movie.description && movie.description.toLowerCase().includes(query)) ||
                    (movie.genre && movie.genre.toLowerCase().includes(query))
                );
                displayMovies(filteredMovies);
            }, 300);
        });
    }
});

// Load picture from Firestore
async function loadProfilePicture(uid) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            if (userData.profilePicture) {
                profileIcon.innerHTML = `<img src="${userData.profilePicture}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                profilePreview.innerHTML = `<img src="${userData.profilePicture}" style="width:100%; height:100%; object-fit:cover;">`;
                selectedImageData = userData.profilePicture;
            } else {
                const username = userNameSpan.textContent || 'U';
                profileIcon.innerHTML = `<span>${username.charAt(0).toUpperCase()}</span>`;
            }
        }
    } catch (error) {
        console.log('Error loading picture:', error);
        const username = userNameSpan ? userNameSpan.textContent : 'U';
        if (profileIcon) {
            profileIcon.innerHTML = `<span>${username.charAt(0).toUpperCase()}</span>`;
        }
    }
}

async function updateDropdownInfo(user) {
    if (user && dropdownEmail) {
        dropdownEmail.textContent = user.email;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('User logged in:', user.uid);
        currentUserUid = user.uid;
        await loadUserInfo(user.uid);
        await updateDropdownInfo(user);
        await loadProfilePicture(user.uid);
        
        await loadSubscription();
        // Load movies and playlists after authentication
        await loadWatchlist();
          await loadPlaylists();
        await loadMovies();
    } else {
        window.location.href = './sign in.html';
    }
});

async function loadUserInfo(uid) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const username = userData.username || 'User';
            
            if (userNameSpan) userNameSpan.textContent = username;
            if (dropdownUsername) dropdownUsername.textContent = username;

            console.log('User data loaded:', userData);
        } else {
            console.log('No user data found');
            if (userNameSpan) userNameSpan.textContent = 'User';
            if (profileIcon) profileIcon.textContent = 'U';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        showToast('Error loading user info', 'error');
    }
}

// ==================== MOVIE FUNCTIONS (FROM FIRESTORE) ====================

// Load watchlist from Firestore
async function loadWatchlist() {
    if (!currentUserUid) return;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            userWatchlist = userData.watchlist || [];
        }
    } catch (error) {
        console.log('No watchlist found');
        userWatchlist = [];
    }
}

// Save watchlist to Firestore
async function saveWatchlist() {
    if (!currentUserUid) return;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userDocRef = doc(db, 'users', userDoc.id);
            
            await updateDoc(userDocRef, {
                watchlist: userWatchlist
            });
        }
    } catch (error) {
        console.error('Error saving watchlist:', error);
    }
}




        // Sort by newest first
        allMovies.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
        });
// Load movies from Firestore
async function loadMovies() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Loading movies...</div>';

    if (currentSection === 'watchlist') {
        displayWatchlist();
        return;
    }

    try {
        const moviesRef = collection(db, 'movies');
        const querySnapshot = await getDocs(moviesRef);
        
        allMovies = [];
        querySnapshot.forEach((doc) => {
            allMovies.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Movies loaded:', allMovies.length); // Debug log

        if (allMovies.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No movies in database yet</h3>
                    <p>Use the admin panel to add movies</p>
                    <a href="admin.html" class="cta-button" style="display: inline-block; margin-top: 15px; text-decoration: none;">Go to Admin Panel</a>
                </div>
            `;
            return;
        }
        displayMovies(allMovies);
    } catch (error) {
        console.error('Error loading movies:', error);
        grid.innerHTML = `
            <div class="empty-state" style="color: red;">
                <h3>Error loading movies</h3>
                <p>${error.message}</p>
                <p>Please check the console for details</p>
            </div>
        `;
    }
}
// Display movies
function displayMovies(movies) {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;
    
    if (movies.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No movies found</h3>
                <p>Add movies from the admin panel</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = movies.map(movie => {
        const isInWatchlist = userWatchlist.some(m => m.id === movie.id);
        return `
            <div class="movie-card" data-movie-id="${movie.id}">
                <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" data-movie-id="${movie.id}">
                    ${isInWatchlist ? '✓' : '+'}
                </button>
                <img class="movie-poster" src="${movie.poster || 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.title}">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-rating">
                        <span class="star">⭐</span>
                        <span>${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.watchlist-btn')) {
                showMovieDetails(card.dataset.movieId, movies);
            }
        });
    });

    grid.querySelectorAll('.watchlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(btn.dataset.movieId, movies);
        });
    });
}

// Display watchlist
function displayWatchlist() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;
    
    if (userWatchlist.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Your watchlist is empty</h3>
                <p>Add movies to your watchlist to see them here</p>
            </div>
        `;
        return;
    }

    displayMovies(userWatchlist);
}

// Toggle watchlist
function toggleWatchlist(movieId, movies) {
    const index = userWatchlist.findIndex(m => m.id === movieId);
    
    if (index > -1) {
        userWatchlist.splice(index, 1);
        showToast('Removed from watchlist', 'success');
    } else {
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
            userWatchlist.push(movie);
            showToast('Added to watchlist', 'success');
        }
    }

    saveWatchlist();
    loadMovies();
}

// Show movie details with Watch & Download buttons

function showMovieDetails(movieId, movies) {
    const modal = document.getElementById('movieModal');
    if (!modal) return;
    
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    document.getElementById('modalTitle').textContent = movie.title;
    document.getElementById('modalBackdrop').src = movie.poster || '';
    document.getElementById('modalOverview').textContent = movie.description || 'No description available';
    
    document.getElementById('modalMeta').innerHTML = `
        <span><span class="star">⭐</span> ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
        <span>📅 ${movie.year || 'Unknown'}</span>
        <span>⏱️ ${movie.duration || 'Unknown'}</span>
        <span>🎭 ${movie.genre || 'Unknown'}</span>
    `;

    // Check if it's a YouTube URL
    const isYouTube = movie.videoUrl && (movie.videoUrl.includes('youtube.com') || movie.videoUrl.includes('youtu.be'));
    
    if (isYouTube) {
        let videoId = '';
        if (movie.videoUrl.includes('watch?v=')) {
            videoId = movie.videoUrl.split('watch?v=')[1].split('&')[0];
        } else if (movie.videoUrl.includes('youtu.be/')) {
            videoId = movie.videoUrl.split('youtu.be/')[1].split('?')[0];
        }
        
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        document.getElementById('modalGenres').innerHTML = `
            <div style="margin-bottom: 20px;">
                <iframe width="100%" height="400" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
            <a href="${movie.videoUrl}" target="_blank" class="cta-button" style="text-decoration: none; display: inline-block; margin-right: 10px;">
                ▶️ Watch on YouTube
            </a>
            <button onclick="showAddToPlaylistModal(${JSON.stringify(movie).replace(/"/g, '&quot;')})" class="cta-button" style="background: #ffc107; border:none; cursor:pointer;">
                📁 Add to Playlist
            </button>
        `;
    } else {
        document.getElementById('modalGenres').innerHTML = `
            <a href="${movie.videoUrl}" target="_blank" class="cta-button" style="text-decoration: none; display: inline-block; margin-right: 10px;">
                ▶️ Watch Now
            </a>
            <a href="${movie.videoUrl}" download class="cta-button" style="text-decoration: none; display: inline-block; background: #28a745; margin-right: 10px;">
                ⬇️ Download
            </a>
            <button onclick="showAddToPlaylistModal(${JSON.stringify(movie).replace(/"/g, '&quot;')})" class="cta-button" style="background: #ffc107; border:none; cursor:pointer;">
                📁 Add to Playlist
            </button>
        `;
    }

    modal.style.display = 'block';
}


// ==================== PLAYLIST FUNCTIONALITY (FIXED) ====================

let userPlaylists = [];
let currentMovieForPlaylist = null;

// Load playlists from Firestore
async function loadPlaylists() {
    if (!currentUserUid) return;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            userPlaylists = userData.playlists || [];
            console.log('Playlists loaded:', userPlaylists.length);
        }
    } catch (error) {
        console.log('No playlists found');
        userPlaylists = [];
    }
}

// Save playlists to Firestore
async function savePlaylists() {
    if (!currentUserUid) return;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userDocRef = doc(db, 'users', userDoc.id);
            
            await updateDoc(userDocRef, {
                playlists: userPlaylists
            });
            console.log('Playlists saved successfully');
        }
    } catch (error) {
        console.error('Error saving playlists:', error);
    }
}

// Setup playlist event listeners
function setupPlaylistListeners() {
    const createPlaylistModal = document.getElementById('createPlaylistModal');
    const addToPlaylistModal = document.getElementById('addToPlaylistModal');
    const savePlaylistBtn = document.getElementById('savePlaylist');
    const cancelCreatePlaylistBtn = document.getElementById('cancelCreatePlaylist');
    const closeAddToPlaylistBtn = document.getElementById('closeAddToPlaylist');
    const createNewPlaylistBtn = document.getElementById('createNewPlaylistBtn');
    const playlistNameInput = document.getElementById('playlistName');

    // Save new playlist
    if (savePlaylistBtn) {
        savePlaylistBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const name = playlistNameInput.value.trim();
            
            if (!name) {
                alert('Please enter a playlist name');
                return;
            }

            const newPlaylist = {
                id: Date.now().toString(),
                name: name,
                movies: [],
                createdAt: new Date().toISOString()
            };

            userPlaylists.push(newPlaylist);
            await savePlaylists();
            
            playlistNameInput.value = '';
            createPlaylistModal.style.display = 'none';
            showToast('Playlist created!', 'success');
            
            // If we're adding a movie, show the add to playlist modal
            if (currentMovieForPlaylist) {
                showAddToPlaylistModal(currentMovieForPlaylist);
            }
        };
    }

    // Cancel create playlist
    if (cancelCreatePlaylistBtn) {
        cancelCreatePlaylistBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            createPlaylistModal.style.display = 'none';
            playlistNameInput.value = '';
        };
    }

    // Close add to playlist modal
    if (closeAddToPlaylistBtn) {
        closeAddToPlaylistBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            addToPlaylistModal.style.display = 'none';
            currentMovieForPlaylist = null;
        };
    }

    // Create new playlist from add to playlist modal
    if (createNewPlaylistBtn) {
        createNewPlaylistBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            addToPlaylistModal.style.display = 'none';
            createPlaylistModal.style.display = 'block';
        };
    }

    // Close modals when clicking outside
    if (createPlaylistModal) {
        createPlaylistModal.onclick = function(e) {
            if (e.target === createPlaylistModal) {
                createPlaylistModal.style.display = 'none';
                playlistNameInput.value = '';
            }
        };
    }

    if (addToPlaylistModal) {
        addToPlaylistModal.onclick = function(e) {
            if (e.target === addToPlaylistModal) {
                addToPlaylistModal.style.display = 'none';
                currentMovieForPlaylist = null;
            }
        };
    }
}

// Show add to playlist modal
window.showAddToPlaylistModal = function(movie) {
    currentMovieForPlaylist = movie;
    const modal = document.getElementById('addToPlaylistModal');
    const playlistsList = document.getElementById('playlistsList');
    
    if (!modal || !playlistsList) return;

    if (userPlaylists.length === 0) {
        playlistsList.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">No playlists yet. Create one!</p>';
    } else {
        playlistsList.innerHTML = userPlaylists.map(playlist => {
            const hasMovie = playlist.movies.some(m => m.id === movie.id);
            return `
                <div class="playlist-item ${hasMovie ? 'selected' : ''}" 
                     onclick="toggleMovieInPlaylist('${playlist.id}')" 
                     style="padding:12px; background:${hasMovie ? '#007bff' : '#f8f9fa'}; 
                            color:${hasMovie ? 'white' : '#333'}; border-radius:8px; 
                            margin-bottom:10px; cursor:pointer; display:flex; 
                            justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${playlist.name}</strong>
                        <div style="font-size:12px; opacity:0.8;">${playlist.movies.length} movies</div>
                    </div>
                    <div style="font-size:20px;">${hasMovie ? '✓' : '+'}</div>
                </div>
            `;
        }).join('');
    }

    modal.style.display = 'block';
};

// Toggle movie in playlist
window.toggleMovieInPlaylist = async function(playlistId) {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist || !currentMovieForPlaylist) return;

    const movieIndex = playlist.movies.findIndex(m => m.id === currentMovieForPlaylist.id);
    
    if (movieIndex > -1) {
        playlist.movies.splice(movieIndex, 1);
        showToast('Removed from ' + playlist.name, 'success');
    } else {
        playlist.movies.push(currentMovieForPlaylist);
        showToast('Added to ' + playlist.name, 'success');
    }

    await savePlaylists();
    showAddToPlaylistModal(currentMovieForPlaylist); // Refresh the modal
};

// Display playlists section
function displayPlaylistsSection() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    if (userPlaylists.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No playlists yet</h3>
                <p>Create playlists to organize your movies</p>
                <button onclick="document.getElementById('createPlaylistModal').style.display='block'" class="cta-button" style="margin-top:15px; border:none; cursor:pointer;">
                    Create First Playlist
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = userPlaylists.map(playlist => `
        <div class="playlist-card" onclick="viewPlaylist('${playlist.id}')" style="cursor:pointer;">
            <div class="playlist-header">
                <div class="playlist-name">${playlist.name}</div>
                <button class="delete-playlist-btn" onclick="event.stopPropagation(); deletePlaylist('${playlist.id}')">
                    Delete
                </button>
            </div>
            <div class="playlist-count">${playlist.movies.length} movies</div>
        </div>
    `).join('') + `
        <div class="playlist-card" onclick="document.getElementById('createPlaylistModal').style.display='block'" style="border: 2px dashed rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; min-height:150px; cursor:pointer;">
            <div style="text-align:center;">
                <div style="font-size:40px;">➕</div>
                <div style="margin-top:10px;">Create New Playlist</div>
            </div>
        </div>
    `;
}

// View playlist
window.viewPlaylist = function(playlistId) {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;

    currentSection = 'playlist-view';
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = playlist.name;
    
    displayMovies(playlist.movies);
};

// Delete playlist
window.deletePlaylist = async function(playlistId) {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    userPlaylists = userPlaylists.filter(p => p.id !== playlistId);
    await savePlaylists();
    showToast('Playlist deleted', 'success');
    displayPlaylistsSection();
};

// Initialize playlists when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupPlaylistListeners();
    
    // Update navigation to handle playlists section
    const navLinks = document.querySelectorAll('.nav-links a[data-section="playlists"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            displayPlaylistsSection();
        });
    });
});


// ==================== SUBSCRIPTION SYSTEM ====================

let userSubscription = null;

// Load subscription status
async function loadSubscription() {
    if (!currentUserUid) return;
    
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            userSubscription = userData.subscription || null;
            
            console.log('Subscription status:', userSubscription);
            updateSubscriptionUI();
        }
    } catch (error) {
        console.log('Error loading subscription:', error);
        userSubscription = null;
    }
}

// Update UI based on subscription status
function updateSubscriptionUI() {
    const subscribeBtn = document.querySelector('a[href="#Subscribe"]');
    
    if (!subscribeBtn) return;

    if (userSubscription && userSubscription.active) {
        // User is subscribed - hide button
        subscribeBtn.style.display = 'none';
        
        // Optional: Add "Premium" badge
        const badge = document.createElement('div');
        badge.innerHTML = '👑 Premium';
        badge.style.cssText = 'background:#ffd700; color:#1e3c72; padding:10px 20px; border-radius:25px; font-weight:bold;';
        badge.id = 'premiumBadge';
        
        // Check if badge doesn't already exist
        if (!document.getElementById('premiumBadge')) {
            subscribeBtn.parentElement.appendChild(badge);
        }
    } else {
        // User is not subscribed - show button
        subscribeBtn.style.display = 'inline-block';
        
        // Remove premium badge if exists
        const badge = document.getElementById('premiumBadge');
        if (badge) badge.remove();
    }
}

// Open subscription modal
document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('a[href="#Subscribe"]');
    const subscriptionModal = document.getElementById('subscriptionModal');
    const closeSubscriptionModal = document.getElementById('closeSubscriptionModal');

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (userSubscription && userSubscription.active) {
                showToast('You are already subscribed!', 'success');
                return;
            }
            
            subscriptionModal.style.display = 'block';
        });
    }

    if (closeSubscriptionModal) {
        closeSubscriptionModal.addEventListener('click', () => {
            subscriptionModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (subscriptionModal) {
        subscriptionModal.addEventListener('click', (e) => {
            if (e.target === subscriptionModal) {
                subscriptionModal.style.display = 'none';
            }
        });
    }
});

// Subscribe function
window.subscribe = async function(plan, price) {
    if (!currentUserUid) {
        showToast('Please log in first', 'error');
        return;
    }

    // Show confirmation
    const confirmed = confirm(`Subscribe to ${plan.toUpperCase()} plan for $${price}/month?`);
    if (!confirmed) return;

    try {
        const subscriptionData = {
            plan: plan,
            price: price,
            active: true,
            startDate: new Date().toISOString(),
        };

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userDocRef = doc(db, 'users', userDoc.id);
            
            await updateDoc(userDocRef, {
                subscription: subscriptionData
            });

            userSubscription = subscriptionData;
            
            // Close modal
            document.getElementById('subscriptionModal').style.display = 'none';
            
            // Update UI
            updateSubscriptionUI();
            
            showToast(`Successfully subscribed to ${plan.toUpperCase()} plan!`, 'success');
            
            // Optional: Show welcome message
            setTimeout(() => {
                alert(`🎉 Welcome to ReelBox ${plan.toUpperCase()}!\n\nYou now have access to:\n• Unlimited movies\n• HD streaming\n• Exclusive features\n\nEnjoy your movies!`);
            }, 500);
        }
    } catch (error) {
        console.error('Error subscribing:', error);
        showToast('Error processing subscription. Please try again.', 'error');
    }
};

// Cancel subscription (optional feature)
window.cancelSubscription = async function() {
    if (!currentUserUid || !userSubscription) return;

    const confirmed = confirm('Are you sure you want to cancel your subscription?');
    if (!confirmed) return;

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUserUid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userDocRef = doc(db, 'users', userDoc.id);
            
            await updateDoc(userDocRef, {
                subscription: {
                    ...userSubscription,
                    active: false,
                    cancelledDate: new Date().toISOString()
                }
            });

            userSubscription = null;
            updateSubscriptionUI();
            
            showToast('Subscription cancelled successfully', 'success');
        }
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        showToast('Error cancelling subscription', 'error');
    }
};