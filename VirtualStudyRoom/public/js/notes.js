document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('noteModal');
  const addBtn = document.getElementById('addNoteBtn');
  const closeBtn = document.querySelector('.close-modal');
  const noteForm = document.getElementById('noteForm');
  const notesList = document.getElementById('notesList');

  // Show modal
  addBtn?.addEventListener('click', () => {
    modal.classList.add('active');
  });

  // Close modal
  closeBtn?.addEventListener('click', () => {
    modal.classList.remove('active');
    noteForm.reset();
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      noteForm.reset();
    }
  });

  // Submit new note
  noteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = noteForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

    const payload = {
      title: document.getElementById('noteTitle').value,
      content: document.getElementById('noteContent').value
    };

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Upload failed');
      await loadNotes();
      modal.classList.remove('active');
      noteForm.reset();
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-save"></i> Save Note`;
    }
  });

  // Load notes
  async function loadNotes() {
    try {
      notesList.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading notes...</div>`;

      const res = await fetch('/api/notes');

console.log("Response status:", res.status); // ✅ LOG FIRST

if (!res.ok) {
  const errorBody = await res.text();
  console.error("Error body:", errorBody); // ✅ LOG SECOND
  throw new Error('Failed to load notes');  // ✅ THROW LAST
}

      const notes = await res.json();
      renderNotes(notes);
    } catch (err) {
      notesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Notes</h3>
          <p>${err.message}</p>
          <button onclick="location.reload()" class="btn-add-note">
            <i class="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      `;
    }
  }

  // Render notes
  function renderNotes(notes) {
    if (!notes || notes.length === 0) {
      notesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-sticky-note"></i>
          <h3>No Notes Available</h3>
          <p>Click "Add Note" to create one!</p>
          <button onclick="document.getElementById('addNoteBtn').click()" class="btn-add-note">
            <i class="fas fa-plus"></i> Add Note
          </button>
        </div>
      `;
      return;
    }

    notesList.innerHTML = notes.map(note => `
      <div class="note-card" 
        data-id="${note.id}" 
        data-title="${encodeURIComponent(note.title)}" 
        data-content="${encodeURIComponent(note.content)}">
        <div class="note-title">${note.title}</div>
        <div class="note-content">${note.content.slice(0, 120)}${note.content.length > 120 ? '...' : ''}</div>
        <div class="note-meta">
          <span>${new Date(note.createdAt).toLocaleString()}</span>
          <button class="btn-delete" data-id="${note.id}">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </div>
    `).join('');

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // prevent card click
        if (confirm('Are you sure you want to delete this note?')) {
          await deleteNote(btn.dataset.id);
        }
      });
    });

    // Expand to full screen on click
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const title = decodeURIComponent(card.dataset.title);
        const content = decodeURIComponent(card.dataset.content);
        detailTitle.textContent = title;
        detailContent.textContent = content;
        noteDetailModal.classList.add('active');
      });
    });
  }

  async function deleteNote(id) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete note');
      await loadNotes();
    } catch (err) {
      alert(err.message);
    }
  }

  // Full note view modal
  const noteDetailModal = document.getElementById('noteDetailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailContent = document.getElementById('detailContent');
  const closeDetailBtn = document.querySelector('.close-detail-modal');

  closeDetailBtn?.addEventListener('click', () => {
    noteDetailModal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === noteDetailModal) {
      noteDetailModal.classList.remove('active');
    }
  });

  loadNotes();
});
