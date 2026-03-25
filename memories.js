document.addEventListener('DOMContentLoaded', () => {

    /**
     * Guest Memories Logic
     * - Supabase Integration
     * - Unified upload state for picker and drag/drop
     * - Client-side image compression
     * - Stored face embeddings for faster matching
     */

    const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    const MATCH_DISTANCE_THRESHOLD = 0.6;
    const MAX_UPLOAD_DIMENSION = 2048;
    const JPEG_QUALITY = 0.85;

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

    // --- STATE ---
    let modelsLoaded = false;
    let modelsPromise = null;
    let selectedFiles = [];

    // --- MODEL LOADING ---
    /**
     * Loads the face detection and recognition models once.
     * @returns {Promise<void>}
     */
    async function loadModels() {
        if (modelsLoaded) return;
        if (modelsPromise) return modelsPromise;
        if (typeof faceapi === 'undefined') {
            throw new Error('face-api.js not loaded');
        }

        modelsPromise = Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL)
        ]).then(() => {
            modelsLoaded = true;
            console.log('Face models loaded');
        }).catch((error) => {
            modelsPromise = null;
            throw error;
        });

        return modelsPromise;
    }

    loadModels().catch((error) => {
        console.error('Failed to load face models:', error);
    });

    // --- MODAL CONTROLS ---
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (!supabaseClient) {
                alert('Please configure Supabase credentials in config.js first!');
                return;
            }
            uploadModal.style.display = 'block';
        });
    }

    closeBtns.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (modal) modal.style.display = 'none';
            resetUpload();
            resetFaceSearch();
        });
    });

    window.addEventListener('click', (event) => {
        if (!event.target.classList.contains('modal')) return;
        event.target.style.display = 'none';
        resetUpload();
        resetFaceSearch();
    });

    // --- UPLOAD LOGIC ---
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropZone.classList.add('active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZone.classList.remove('active');
            updateSelectedFiles(Array.from(event.dataTransfer.files));
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            updateSelectedFiles(Array.from(event.target.files));
        });
    }

    /**
     * Stores the selected upload files in one shared state for both picker and drag/drop.
     * @param {File[]} files - Candidate files from the picker or drop zone
     * @returns {void}
     */
    function updateSelectedFiles(files) {
        const validFiles = files.filter((file) => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            alert('Please select image files.');
            return;
        }

        selectedFiles = validFiles;
        renderSelectedFiles();
    }

    /**
     * Renders the current upload selection preview grid.
     * @returns {void}
     */
    function renderSelectedFiles() {
        if (!previewGrid) return;

        previewGrid.innerHTML = '';

        selectedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = file.name;
                previewGrid.appendChild(img);
            };
            reader.readAsDataURL(file);
        });

        if (dropZone) dropZone.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');
    }

    /**
     * Resets upload UI and file state.
     * @returns {void}
     */
    function resetUpload() {
        selectedFiles = [];
        if (fileInput) fileInput.value = '';
        if (dropZone) dropZone.classList.remove('hidden');
        if (previewContainer) previewContainer.classList.add('hidden');
        if (uploadProgress) uploadProgress.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
        if (previewGrid) previewGrid.innerHTML = '';
        if (confirmUpload) confirmUpload.disabled = false;
    }

    if (cancelUpload) {
        cancelUpload.addEventListener('click', resetUpload);
    }

    if (confirmUpload) {
        confirmUpload.addEventListener('click', async () => {
            if (!selectedFiles.length || !supabaseClient) return;

            confirmUpload.disabled = true;
            uploadProgress.classList.remove('hidden');

            let uploadedCount = 0;
            const totalFiles = selectedFiles.length;

            try {
                for (const [index, file] of selectedFiles.entries()) {
                    const progress = ((index + 1) / totalFiles) * 100;
                    progressFill.style.width = `${progress}%`;

                    const optimizedBlob = await compressImage(file);
                    const faceEmbedding = await extractFaceEmbedding(optimizedBlob);
                    const fileName = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}.jpg`;

                    const { error: storageError } = await supabaseClient.storage
                        .from('memories')
                        .upload(fileName, optimizedBlob, {
                            contentType: 'image/jpeg',
                            upsert: false
                        });

                    if (storageError) throw storageError;

                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('memories')
                        .getPublicUrl(fileName);

                    const photoRecord = {
                        url: publicUrl,
                        storage_path: fileName,
                        face_embedding: faceEmbedding
                    };

                    const { error: dbError } = await supabaseClient
                        .from('photos')
                        .insert([photoRecord]);

                    if (dbError) throw dbError;
                    uploadedCount++;
                }

                setTimeout(() => {
                    uploadModal.style.display = 'none';
                    resetUpload();
                    fetchMemories();
                }, 500);
            } catch (error) {
                console.error('Upload failed:', error);
                alert(`Uploaded ${uploadedCount} of ${totalFiles} photos. Error: ${error.message}`);
                confirmUpload.disabled = false;
            }
        });
    }

    /**
     * Compresses an image to a JPEG blob while preserving aspect ratio.
     * @param {File|Blob} file - Original image file/blob
     * @returns {Promise<Blob>}
     */
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    if (width > height && width > MAX_UPLOAD_DIMENSION) {
                        height *= MAX_UPLOAD_DIMENSION / width;
                        width = MAX_UPLOAD_DIMENSION;
                    } else if (height > MAX_UPLOAD_DIMENSION) {
                        width *= MAX_UPLOAD_DIMENSION / height;
                        height = MAX_UPLOAD_DIMENSION;
                    }

                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context unavailable'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Image compression failed'));
                            return;
                        }
                        resolve(blob);
                    }, 'image/jpeg', JPEG_QUALITY);
                };
                img.onerror = () => reject(new Error('Image preview failed to load'));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error('Could not read the selected file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Extracts a single face embedding from an uploaded image.
     * Returns null when no recognizable face is found so uploads still succeed.
     * @param {Blob} imageBlob - Optimized upload image
     * @returns {Promise<string|null>}
     */
    async function extractFaceEmbedding(imageBlob) {
        try {
            await loadModels();
            const image = await faceapi.bufferToImage(imageBlob);
            const detection = await faceapi
                .detectSingleFace(image)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) return null;
            return vectorToString(detection.descriptor);
        } catch (error) {
            console.warn('Skipping face embedding for this upload:', error);
            return null;
        }
    }

    /**
     * Converts a face descriptor to a pgvector-compatible string.
     * @param {Float32Array|number[]} vector - Face descriptor values
     * @returns {string}
     */
    function vectorToString(vector) {
        return `[${Array.from(vector).join(',')}]`;
    }

    /**
     * Parses a stored pgvector value into a number array.
     * @param {string|number[]|null} value - Stored vector value
     * @returns {number[]|null}
     */
    function parseVector(value) {
        if (!value) return null;
        if (Array.isArray(value)) return value.map(Number);

        if (typeof value === 'string') {
            try {
                return JSON.parse(value).map(Number);
            } catch (error) {
                console.warn('Could not parse stored face embedding:', error);
            }
        }

        return null;
    }

    /**
     * Computes Euclidean distance between two descriptors.
     * @param {Float32Array|number[]} left - First descriptor
     * @param {Float32Array|number[]} right - Second descriptor
     * @returns {number}
     */
    function euclideanDistance(left, right) {
        if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;

        let sum = 0;
        for (let index = 0; index < left.length; index++) {
            const delta = Number(left[index]) - Number(right[index]);
            sum += delta * delta;
        }

        return Math.sqrt(sum);
    }

    // --- GALLERY LOGIC ---
    /**
     * Loads the latest gallery photos from Supabase.
     * @returns {Promise<void>}
     */
    async function fetchMemories() {
        if (!supabaseClient) {
            console.error('fetchMemories called but supabaseClient is null');
            return;
        }

        const { data, error } = await supabaseClient
            .from('photos')
            .select('id, created_at, url, storage_path')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Photo fetch failed:', error);
            if (memoriesGrid) {
                memoriesGrid.innerHTML = `
                    <div class="gallery-loader">
                        <i class="fas fa-exclamation-triangle" style="color: #ff4d4d; font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Failed to load photos: ${error.message}</p>
                        <button id="retry-gallery" class="outline-btn" style="margin-top: 10px;">Try Again</button>
                    </div>`;

                const retryBtn = document.getElementById('retry-gallery');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        fetchMemories();
                    });
                }
            }
            return;
        }

        renderGallery(data || []);
    }

    // --- FACE SEARCH LOGIC ---
    if (findMeBtn) {
        findMeBtn.addEventListener('click', async () => {
            try {
                await loadModels();
            } catch (error) {
                console.error('Models still unavailable:', error);
                alert('Face matching models are still loading. Please try again in a moment.');
                return;
            }

            faceModal.style.display = 'block';
        });
    }

    if (faceDropZone) {
        faceDropZone.addEventListener('click', () => faceInput.click());
    }

    if (faceInput) {
        faceInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            faceDropZone.classList.add('hidden');
            faceProcessing.classList.remove('hidden');

            try {
                await loadModels();
                const image = await faceapi.bufferToImage(file);
                const detection = await faceapi
                    .detectSingleFace(image)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detection) {
                    alert('No face detected. Please try a clearer selfie!');
                    resetFaceSearch();
                    return;
                }

                await performFaceSearch(detection.descriptor);
            } catch (error) {
                console.error('Face search failed:', error);
                alert('Face search failed. Please try again.');
                resetFaceSearch();
            }
        });
    }

    /**
     * Queries matching photos using stored face embeddings.
     * Falls back to local vector comparison when the SQL helper is unavailable.
     * @param {Float32Array} targetDescriptor - Descriptor from the selfie photo
     * @returns {Promise<Object[]>}
     */
    async function queryMatchedPhotos(targetDescriptor) {
        const queryEmbedding = vectorToString(targetDescriptor);

        const rpcResponse = await supabaseClient.rpc('match_photos_by_embedding', {
            query_embedding: queryEmbedding,
            match_threshold: MATCH_DISTANCE_THRESHOLD,
            match_count: 200
        });

        if (!rpcResponse.error) {
            return rpcResponse.data || [];
        }

        console.warn('match_photos_by_embedding RPC unavailable, falling back to local embedding comparison:', rpcResponse.error);

        const { data: photos, error } = await supabaseClient
            .from('photos')
            .select('id, created_at, url, storage_path, face_embedding')
            .not('face_embedding', 'is', null);

        if (error) throw error;

        return (photos || [])
            .map((photo) => {
                const storedEmbedding = parseVector(photo.face_embedding);
                return {
                    ...photo,
                    distance: euclideanDistance(targetDescriptor, storedEmbedding)
                };
            })
            .filter((photo) => Number.isFinite(photo.distance) && photo.distance <= MATCH_DISTANCE_THRESHOLD)
            .sort((left, right) => left.distance - right.distance);
    }

    /**
     * Runs the photo face match flow and updates the gallery.
     * @param {Float32Array} targetDescriptor - Descriptor from the selfie photo
     * @returns {Promise<void>}
     */
    async function performFaceSearch(targetDescriptor) {
        const matchedPhotos = await queryMatchedPhotos(targetDescriptor);

        renderGallery(matchedPhotos);
        if (filterStatus) filterStatus.classList.remove('hidden');

        if (matchedPhotos.length === 0) {
            alert('No photos found with your face. Try a clearer selfie!');
        }

        if (faceModal) faceModal.style.display = 'none';
        resetFaceSearch();
    }

    /**
     * Resets the face search modal state.
     * @returns {void}
     */
    function resetFaceSearch() {
        if (faceInput) faceInput.value = '';
        if (faceDropZone) faceDropZone.classList.remove('hidden');
        if (faceProcessing) faceProcessing.classList.add('hidden');
    }

    if (clearFilter) {
        clearFilter.addEventListener('click', () => {
            filterStatus.classList.add('hidden');
            fetchMemories();
        });
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

    /**
     * Opens the lightbox for the selected photo URL.
     * @param {string} url - Selected image URL
     * @returns {void}
     */
    function openLightbox(url) {
        const photos = Array.from(memoriesGrid.querySelectorAll('.gallery-item img'));
        currentGalleryPhotos = photos.map((img) => img.src);
        currentIndex = currentGalleryPhotos.findIndex((src) => src === url);

        if (currentIndex === -1) {
            console.error('Photo not found in gallery list:', url);
            return;
        }

        updateLightboxImage();
        if (lightbox) lightbox.classList.add('show');
        document.body.classList.add('lightbox-open');
    }

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
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch image');

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

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

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', (event) => {
        event.stopPropagation();
        showPrev();
    });
    if (lightboxNext) lightboxNext.addEventListener('click', (event) => {
        event.stopPropagation();
        showNext();
    });
    if (lightboxDownload) lightboxDownload.addEventListener('click', (event) => {
        event.stopPropagation();
        downloadCurrentPhoto();
    });
    if (lightbox) lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
        if (!lightbox || !lightbox.classList.contains('show')) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowRight') showNext();
        if (event.key === 'ArrowLeft') showPrev();
    });

    if (memoriesGrid) {
        memoriesGrid.addEventListener('click', (event) => {
            const item = event.target.closest('.gallery-item');
            if (!item) return;

            const img = item.querySelector('img');
            if (img) openLightbox(img.src);
        });
    }

    /**
     * Renders a photo list into the memories grid.
     * @param {Object[]} photos - Gallery photos
     * @returns {void}
     */
    function renderGallery(photos) {
        if (!memoriesGrid) return;

        if (photos.length === 0) {
            memoriesGrid.innerHTML = '<div class="gallery-loader"><p>No photos found. Be the first to share a memory!</p></div>';
            return;
        }

        memoriesGrid.innerHTML = photos.map((photo) => `
            <div class="gallery-item fade-in">
                <img src="${photo.url}" alt="Wedding Memory" loading="lazy">
            </div>
        `).join('');

        setTimeout(() => {
            const items = memoriesGrid.querySelectorAll('.gallery-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('appear');
                }, index * 100);
            });
        }, 50);
    }

    // --- INITIAL LOAD ---
    if (supabaseClient) {
        fetchMemories();

        supabaseClient
            .channel('public:photos')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () => {
                fetchMemories();
            })
            .subscribe();
    }
});
