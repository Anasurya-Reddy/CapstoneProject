document.addEventListener('DOMContentLoaded', async () => {
    // Load user data
    const loadUserData = async () => {
        try {
            const response = await fetch('/api/user');
            if (!response.ok) throw new Error('Unauthorized');
            
            const user = await response.json();
            
            // Update UI
            document.getElementById('userInfo').innerHTML = `
                <span class="user-name">${user.name || 'User'}</span>
                <span class="user-email">${user.email}</span>
            `;
            
            document.getElementById('welcomeName').textContent = user.name?.split(' ')[0] || 'there';
            
            // Set avatar (using UI Avatars API or user's uploaded photo)
            const avatar = document.getElementById('userAvatar');
            if (user.profilePhoto) {
                avatar.src = user.profilePhoto;
                document.getElementById('currentPhoto').src = user.profilePhoto;
            } else if (user.name) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
            }
            
        } catch (error) {
            window.location.href = '/auth/login.html';
        }
    };

    // Modal handling
    const profileModal = document.getElementById('profileModal');
    const closeModal = document.querySelector('.close-modal');
    const choosePhotoBtn = document.getElementById('choosePhotoBtn');
    const savePhotoBtn = document.getElementById('savePhotoBtn');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    
    // Open profile modal
    document.getElementById('profileBtn').addEventListener('click', (e) => {
        e.preventDefault();
        profileModal.style.display = 'block';
    });
    
    // Open photo upload directly
    document.getElementById('uploadPhotoBtn').addEventListener('click', (e) => {
        e.preventDefault();
        profileModal.style.display = 'block';
        profilePhotoInput.click();
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
    
    // Choose photo button
    choosePhotoBtn.addEventListener('click', () => {
        profilePhotoInput.click();
    });
    
    // Handle file selection
    profilePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('currentPhoto').src = event.target.result;
                savePhotoBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Save photo
    savePhotoBtn.addEventListener('click', async () => {
        const file = profilePhotoInput.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('profilePhoto', file);
        
        try {
            const response = await fetch('/api/user/profile-photo', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                document.getElementById('userAvatar').src = result.profilePhotoUrl;
                profileModal.style.display = 'none';
                alert('Profile photo updated successfully!');
            } else {
                throw new Error('Failed to upload photo');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to update profile photo');
        }
    });

    // Logout handler - Fixed implementation
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/auth/logout', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                window.location.href = '/';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
        }
    });

    // Load recent activity and counts
    const loadRecentActivity = async () => {
        try {
            const response = await fetch('/api/recent-activity');
            if (!response.ok) throw new Error('Failed to load activity');
            
            const activities = await response.json();
            const container = document.getElementById('recentActivity');
            
            container.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Activity load error:', error);
        }
    };

    // Initialize
    await loadUserData();
    await loadRecentActivity();
    await updateCounts();
});

// Update counts function
async function updateCounts() {
    try {
        // Get active rooms count
        const roomsRes = await fetch('/api/rooms/count');
        const roomsData = await roomsRes.json();
        document.getElementById('activeRoomsCount').textContent = roomsData.count;
        
        // Get notes count
        const notesRes = await fetch('/api/notes/count');
        const notesData = await notesRes.json();
        document.getElementById('notesCount').textContent = notesData.count;
    } catch (error) {
        console.error('Failed to update counts:', error);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('profileModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});