document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('roomModal');
    const createBtn = document.getElementById('createRoomBtn');
    const closeBtn = document.querySelector('.close-modal');
    const roomForm = document.getElementById('roomForm');
    const upcomingRooms = document.getElementById('upcomingRooms');
    const formError = document.getElementById('formError');

    // Open modal
    createBtn?.addEventListener('click', () => {
        modal.classList.add('active');
        formError.style.display = 'none';
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('active');
        roomForm.reset();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            roomForm.reset();
        }
    });

    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = roomForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Creating...`;

        const room = {
            name: document.getElementById('roomName').value.trim(),
            link: document.getElementById('roomLink').value.trim(),
            schedule: document.getElementById('roomSchedule').value,
            duration: parseInt(document.getElementById('roomDuration').value)
        };

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(room)
            });

            if (!res.ok) throw new Error((await res.json()).error || 'Failed to create room');

            roomForm.reset();
            modal.classList.remove('active');
            await loadRooms();
            await updateCounts();
        } catch (err) {
            formError.textContent = err.message;
            formError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-plus"></i> Create Room`;
        }
    });

    async function loadRooms() {
        try {
            upcomingRooms.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading rooms...</div>`;
            const res = await fetch('/api/rooms');
            if (!res.ok) throw new Error('Could not fetch rooms');
            const rooms = await res.json();

            upcomingRooms.innerHTML = rooms.length > 0
                ? rooms.map(room => {
                    const expired = new Date(room.expiresAt) < new Date();
                    return `
                        <div class="room-card ${expired ? 'expired' : ''}">
                            <h3>${room.name}</h3>
                            <p><i class="fas fa-link"></i> ${room.link}</p>
                            <p><i class="fas fa-calendar-alt"></i> ${new Date(room.schedule).toLocaleString()}</p>
                            <p><i class="fas fa-clock"></i> ${room.duration} minutes</p>
                            <a href="${room.link}" class="room-link" target="_blank">
                                ${expired ? 'Expired' : 'Join Room'} <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>`;
                }).join('')
                : `<div class="empty-state"><h3>No Rooms Available</h3><p>Click "Create Room" to add one!</p></div>`;
        } catch (error) {
            upcomingRooms.innerHTML = `<div class="empty-state">Error loading rooms: ${error.message}</div>`;
        }
    }

    async function updateCounts() {
        try {
            const res = await fetch('/api/rooms/count');
            if (!res.ok) throw new Error('Count fetch failed');
            const { count } = await res.json();
            const countElem = document.getElementById('activeRoomsCount');
            if (countElem) countElem.textContent = count;
        } catch (error) {
            console.error('Error updating room count:', error);
        }
    }

    loadRooms();
    updateCounts();
    setInterval(loadRooms, 30000);
});
