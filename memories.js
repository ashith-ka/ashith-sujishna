document.addEventListener('DOMContentLoaded', () => {

    /**
     * Guest Memories Logic
     * - Supabase Integration
     * - Client-side Image Compression (2K High Quality)
     * - Real-time Gallery
     * - Face-api.js Integration (Find My Photos)
     */

    // --- SUPABASE INITIALIZATION ---
    if (typeof CONFIG === 'undefined') {
        console.error('config.js not loaded!');
        alert('Config file (config.js) not found. Please ensure it exists.');
        return;
    }
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = CONFIG;

    let supabaseClient = null;
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // --- DOM ELEMENTS ---
    const uploadBtn = document.getElementById('upload-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewGrid = document.getElementById('preview-grid');
    const uploadPreview = document.getElementById('upload-preview');
    const cancelUpload = document.getElementById('cancel-upload');
    const confirmUpload = document.getElementById('confirm-upload');
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.querySelector('.progress-fill');
    const memoriesGrid = document.getElementById('memories-grid');

    const findMeBtn = document.getElementById('find-me-btn');
    const faceModal = document.getElementById('face-modal');
    const faceInput = document.getElementById('face-input');
    const faceDropZone = document.getElementById('face-drop-zone');
    const faceProcessing = document.getElementById('face-processing');
    const filterStatus = document.getElementById('filter-status');
    const clearFilter = document.getElementById('clear-filter');

    let modelsLoaded = false;

    // --- MODEL LOADING ---
    async function loadModels() {
        if (typeof faceapi === 'undefined') {
            console.error('face-api.js not loaded!');
            return;
        }
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            modelsLoaded = true;
            console.log('Face models loaded');
        } catch (err) {
            console.error('Failed to load face models:', err);
        }
    }
    loadModels();

    // --- MODAL CONTROLS ---
    if (uploadBtn) {
        uploadBtn.onclick = () => {
            if (!supabaseClient) {
                alert('Please configure Supabase credentials in config.js first!');
                return;
            }
            uploadModal.style.display = 'block';
        };
    }

    closeBtns.forEach(btn => {
        btn.onclick = (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
            resetUpload();
        };
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            resetUpload();
        }
    };

    // --- UPLOAD LOGIC ---
    if (dropZone) {
        dropZone.onclick = () => fileInput.click();

        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        };

        dropZone.ondragleave = () => dropZone.classList.remove('active');

        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        };
    }

    if (fileInput) {
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length) handleFileSelect(files);
        };
    }

    function handleFileSelect(files) {
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            alert('Please select image files.');
            return;
        }

        previewGrid.innerHTML = '';
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewGrid.appendChild(img);
            };
            reader.readAsDataURL(file);
        });

        if (dropZone) dropZone.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');
    }

    function resetUpload() {
        if (fileInput) fileInput.value = '';
        if (dropZone) dropZone.classList.remove('hidden');
        if (previewContainer) previewContainer.classList.add('hidden');
        if (uploadProgress) uploadProgress.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
        if (previewGrid) previewGrid.innerHTML = '';
    }

    if (cancelUpload) cancelUpload.onclick = resetUpload;

    if (confirmUpload) {
        confirmUpload.onclick = async () => {
            const files = Array.from(fileInput.files);
            if (!files.length) return;

            confirmUpload.disabled = true;
            uploadProgress.classList.remove('hidden');

            let uploadedCount = 0;
            const totalFiles = files.length;

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const progress = ((i + 1) / totalFiles) * 100;
                    progressFill.style.width = `${progress}%`;

                    const optimizedBlob = await compressImage(file);
                    const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.jpg`;
                    const { data: storageData, error: storageError } = await supabaseClient.storage
                        .from('memories')
                        .upload(fileName, optimizedBlob);

                    if (storageError) throw storageError;

                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('memories')
                        .getPublicUrl(fileName);

                    const { error: dbError } = await supabaseClient
                        .from('photos')
                        .insert([{ url: publicUrl, storage_path: fileName }]);

                    if (dbError) throw dbError;
                    uploadedCount++;
                }

                setTimeout(() => {
                    uploadModal.style.display = 'none';
                    resetUpload();
                    confirmUpload.disabled = false;
                    fetchMemories();
                }, 500);

            } catch (err) {
                console.error('Upload failed:', err);
                alert(`Uploaded ${uploadedCount} of ${totalFiles} photos. Error: ${err.message}`);
                confirmUpload.disabled = false;
            }
        };
    }

    /**
     * Image Compression Logic
     * Resizes to 2048px max width/height while maintaining aspect ratio.
     */
    function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max = 2048;

                    if (width > height && width > max) {
                        height *= max / width;
                        width = max;
                    } else if (height > max) {
                        width *= max / height;
                        height = max;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.85); // High quality 85%
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- GALLERY LOGIC ---
    async function fetchMemories() {
        if (!supabaseClient) {
            console.error('fetchMemories called but supabaseClient is null');
            return;
        }

        console.log('🔄 Fetching memories from Supabase...');
        const { data, error } = await supabaseClient
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Fetch error:', error);
            if (memoriesGrid) {
                memoriesGrid.innerHTML = `
                    <div class="gallery-loader">
                        <i class="fas fa-exclamation-triangle" style="color: #ff4d4d; font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Failed to load photos: ${error.message}</p>
                        <button onclick="location.reload()" class="outline-btn" style="margin-top: 10px;">Try Again</button>
                    </div>`;
            }
            return;
        }

        console.log('✅ Successfully fetched data:', data);
        renderGallery(data);
    }

    // --- FACE SEARCH LOGIC ---
    if (findMeBtn) {
        findMeBtn.onclick = async () => {
            if (!modelsLoaded) {
                alert('Models still loading, please wait a moment...');
                return;
            }
            faceModal.style.display = 'block';
        };
    }

    if (faceDropZone) {
        faceDropZone.onclick = () => faceInput.click();
    }

    if (faceInput) {
        faceInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            faceDropZone.classList.add('hidden');
            faceProcessing.classList.remove('hidden');

            try {
                const img = await faceapi.bufferToImage(file);
                const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

                if (!detection) {
                    alert('No face detected. Please try a clearer selfie!');
                    resetFaceSearch();
                    return;
                }

                await performFaceSearch(detection.descriptor);

            } catch (err) {
                console.error('Face search failed:', err);
                alert('Face search failed. Please try again.');
                resetFaceSearch();
            }
        };
    }

    async function performFaceSearch(targetDescriptor) {
        const { data: photos, error } = await supabaseClient.from('photos').select('*');
        if (error) throw error;

        const matchedPhotos = [];
        const SIMILARITY_THRESHOLD = 0.6; // Distance threshold (lower = more similar, face-api uses euclidean distance)

        // Scan gallery for matches
        for (const photo of photos) {
            try {
                // Load and detect faces in the gallery photo
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = photo.url;
                });

                const detection = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    // Calculate distance between target and detected face
                    const distance = faceapi.euclideanDistance(targetDescriptor, detection.descriptor);

                    // If distance is below threshold, it's a match
                    if (distance < SIMILARITY_THRESHOLD) {
                        matchedPhotos.push(photo);
                    }
                }
            } catch (err) {
                console.warn('Could not process photo:', photo.id, err);
                // Continue with next photo if this one fails
            }
        }

        renderGallery(matchedPhotos);
        if (filterStatus) filterStatus.classList.remove('hidden');
        if (matchedPhotos.length === 0) {
            alert('No photos found with your face. Try a clearer selfie!');
        }
        if (faceModal) faceModal.style.display = 'none';
        resetFaceSearch();
    }

    function resetFaceSearch() {
        if (faceInput) faceInput.value = '';
        if (faceDropZone) faceDropZone.classList.remove('hidden');
        if (faceProcessing) faceProcessing.classList.add('hidden');
    }

    if (clearFilter) {
        clearFilter.onclick = () => {
            filterStatus.classList.add('hidden');
            fetchMemories();
        };
    }

    // --- LIGHTBOX LOGIC ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const lightboxDownload = document.getElementById('lightbox-download');
    let currentGalleryPhotos = [];
    let currentIndex = 0;

    // Use a function that can be called globally or via event delegation
    const openLightbox = (url) => {
        const photos = Array.from(memoriesGrid.querySelectorAll('.gallery-item img'));
        currentGalleryPhotos = photos.map(img => img.src);

        // Find the absolute URL match
        currentIndex = currentGalleryPhotos.findIndex(src => src === url);

        // If not found by exact match, try relative match or just find by src
        if (currentIndex === -1) {
            currentIndex = currentGalleryPhotos.indexOf(url);
        }

        if (currentIndex !== -1) {
            updateLightboxImage();
            if (lightbox) lightbox.classList.add('show');
            document.body.classList.add('lightbox-open');
        } else {
            console.error('Photo not found in gallery list:', url);
        }
    };

    // Expose to window just in case anything else tries to call it
    window.openLightbox = openLightbox;

    function updateLightboxImage() {
        if (!lightboxImg || currentIndex === -1) return;
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = currentGalleryPhotos[currentIndex];
            lightboxImg.style.opacity = '1';
        }, 150);
    }

    function closeLightbox() {
        if (lightbox) lightbox.classList.remove('show');
        document.body.classList.remove('lightbox-open');
    }

    async function downloadCurrentPhoto() {
        if (currentIndex === -1 || currentGalleryPhotos.length === 0) return;

        const imageUrl = currentGalleryPhotos[currentIndex];
        const fileName = `memory-${Date.now()}.jpg`;

        try {
            // Fetch the image as a blob to support external URLs better
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            const blob = await response.blob();

            // Create object URL and trigger download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download photo. Please try again.');
        }
    }

    function showNext() {
        if (currentGalleryPhotos.length === 0) return;
        currentIndex = (currentIndex + 1) % currentGalleryPhotos.length;
        updateLightboxImage();
    }

    function showPrev() {
        if (currentGalleryPhotos.length === 0) return;
        currentIndex = (currentIndex - 1 + currentGalleryPhotos.length) % currentGalleryPhotos.length;
        updateLightboxImage();
    }

    if (lightboxClose) lightboxClose.onclick = closeLightbox;
    if (lightboxPrev) lightboxPrev.onclick = (e) => { e.stopPropagation(); showPrev(); };
    if (lightboxNext) lightboxNext.onclick = (e) => { e.stopPropagation(); showNext(); };
    if (lightboxDownload) lightboxDownload.onclick = (e) => { e.stopPropagation(); downloadCurrentPhoto(); };
    if (lightbox) lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };

    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('show')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    // Event Delegation for Gallery Images
    if (memoriesGrid) {
        memoriesGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const img = item.querySelector('img');
                if (img) {
                    console.log('🔍 Lightbox opening for:', img.src);
                    openLightbox(img.src);
                }
            }
        });
    }

    function renderGallery(photos) {
        if (!memoriesGrid) return;
        if (photos.length === 0) {
            memoriesGrid.innerHTML = '<div class="gallery-loader"><p>No photos found. Be the first to share a memory!</p></div>';
            return;
        }

        console.log(`🖼️ Rendering ${photos.length} photos...`);
        // Remove inline onclick handler
        memoriesGrid.innerHTML = photos.map(photo => `
            <div class="gallery-item fade-in">
                <img src="${photo.url}" alt="Wedding Memory" loading="lazy">
            </div>
        `).join('');

        // Trigger fade-in animation for new items
        setTimeout(() => {
            const items = memoriesGrid.querySelectorAll('.gallery-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('appear');
                }, index * 100); // Staggered entrance
            });
        }, 50);
    }

    // Initial Load
    if (supabaseClient) {
        fetchMemories();

        // Real-time updates
        supabaseClient
            .channel('public:photos')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, payload => {
                fetchMemories();
            })
            .subscribe();
    }
});
