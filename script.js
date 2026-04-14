document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Cover / Opening Animation ---
    const cover = document.getElementById('cover');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMalayalam = document.documentElement.lang === 'ml' || document.body.classList.contains('malayalam');
    const pageCopy = isMalayalam ? {
        dataSaverNotice: 'ഡാറ്റ സംരക്ഷിക്കാൻ വീഡിയോ നിർത്തിയിരിക്കുന്നു',
        countdownDone: 'ഇന്ന് ഞങ്ങളുടെ വിവാഹദിനമാണ്!',
        countdownFont: "var(--font-ml-display)",
        calendarTitle: 'അഷിത്ത് & സുജിഷ്‌ണ വിവാഹം',
        calendarDetails: 'ഞങ്ങളുടെ വിവാഹത്തിൽ പങ്കുചേരാൻ സ്നേഹപൂർവ്വം സ്വാഗതം.\n\nവിവാഹച്ചടങ്ങ്: രാവിലെ 9:45 - 10:30, SHA International Auditorium, ചേറ്റുവ\nസ്‌നേഹവിരുന്ന്: വൈകിട്ട് 4:00 - 7:00, Jubilee Convention Centre, കാട്ടൂർ',
        calendarLocation: 'SHA International Auditorium, Chettuva, Kerala',
        shareTitle: 'അഷിത്ത് & സുജിഷ്‌ണ വിവാഹം',
        shareText: '2026 മെയ് 3-ന് നടക്കുന്ന ഞങ്ങളുടെ വിവാഹച്ചടങ്ങിലും സ്‌നേഹവിരുന്നിലും സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു.',
        copiedText: 'ലിങ്ക് കോപ്പിയായി!'
    } : {
        dataSaverNotice: 'Video paused to save data on your connection',
        countdownDone: "It's Our Wedding Day!",
        countdownFont: "var(--font-heading)",
        calendarTitle: "Ashith & Sujishna's Wedding",
        calendarDetails: 'Join us to celebrate our wedding!\n\nWedding Ceremony: 9:45 AM - 10:30 AM at SHA International Auditorium, Chettuva\nReception: 4:00 PM - 7:00 PM at Jubilee Convention Centre, Kattoor',
        calendarLocation: 'SHA International Auditorium, Chettuva, Kerala',
        shareTitle: "Ashith & Sujishna's Wedding",
        shareText: 'Join us in celebrating the wedding of Ashith and Sujishna on May 3rd, 2026.',
        copiedText: 'Copied!'
    };

    if (cover) {
        let isCoverOpening = false;

        cover.addEventListener('click', () => {
            if (isCoverOpening) return;

            isCoverOpening = true;
            const pressDuration = prefersReducedMotion ? 0 : 110;
            const openingDelay = pressDuration;
            const openedDelay = prefersReducedMotion ? 180 : 980;
            const zoomDelay = prefersReducedMotion ? 240 : 1260;
            const revealDelay = prefersReducedMotion ? 260 : 1390;
            const exitDelay = prefersReducedMotion ? 360 : 2130;

            cover.classList.add('is-pressed');

            window.setTimeout(() => {
                cover.classList.remove('is-pressed');
                cover.classList.add('is-opening');
            }, openingDelay);

            window.setTimeout(() => {
                cover.classList.add('is-opened');
            }, openedDelay);

            window.setTimeout(() => {
                cover.classList.add('is-zooming');
            }, zoomDelay);

            window.setTimeout(() => {
                document.body.classList.add('cover-opened');

                // Try to autoplay video after user interaction
                const heroVideo = document.getElementById('hero-video');
                if (heroVideo) {
                    heroVideo.play().catch(e => console.log("Video autoplay failed:", e));
                }
            }, revealDelay);

            window.setTimeout(() => {
                cover.classList.add('is-exiting');
            }, exitDelay - 180);

            window.setTimeout(() => {
                cover.classList.add('hidden');
            }, exitDelay);
        });
    } else {
        // No cover - show content immediately
        document.body.classList.add('cover-opened');
    }

    // --- 1. Network Detection: Disable video on slow connections ---
    const heroVideo = document.getElementById('hero-video');
    const videoContainer = document.querySelector('.video-container');

    function isSlowConnection() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return false; // Unknown — give benefit of the doubt
        // Save-Data mode (user explicitly opted in to saving data)
        if (conn.saveData) return true;
        // 2G or 3G effective connection type
        return ['slow-2g', '2g', '3g'].includes(conn.effectiveType);
    }

    if (heroVideo && isSlowConnection()) {
        // Remove the video to avoid downloading a large file
        heroVideo.remove();

        // Apply a romantic gradient fallback to the video container
        if (videoContainer) {
            videoContainer.style.background = 'linear-gradient(135deg, #1a0a0f 0%, #4a1530 35%, #7b2d4a 65%, #2c0d1f 100%)';
            videoContainer.style.position = 'absolute';
            videoContainer.style.inset = '0';
        }

        // Show a small non-intrusive data-saver notice
        const notice = document.createElement('div');
        notice.style.cssText = [
            'position:fixed', 'bottom:70px', 'left:50%', 'transform:translateX(-50%)',
            'background:rgba(0,0,0,0.65)', 'color:#e8c7d0', 'font-size:11px',
            'padding:6px 14px', 'border-radius:20px', 'z-index:9999',
            `font-family:${isMalayalam ? "'Manjari', sans-serif" : "sans-serif"}`, 'pointer-events:none', 'white-space:nowrap',
            'backdrop-filter:blur(4px)'
        ].join(';');
        notice.textContent = `📶 ${pageCopy.dataSaverNotice}`;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 5000); // Auto-dismiss after 5s
    }

    // --- 1. Music Player Logic ---
    const musicToggle = document.getElementById('music-toggle');
    const bgMusic = document.getElementById('bg-music');
    let isPlaying = false;

    // Optional: Lower volume slightly for better background ambiance
    bgMusic.volume = 0.4;

    musicToggle.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-music"></i>';
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.play().catch(e => console.log("Audio play failed due to browser policies:", e));
            musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
            musicToggle.classList.add('playing');
        }
        isPlaying = !isPlaying;
    });

    // --- 2. Countdown Timer Logic ---
    // Set the date we're counting down to: May 3rd, 2026, 10:00 AM IST (India Standard Time)
    const countDownDate = new Date("2026-05-03T10:00:00+05:30").getTime();

    // Update the count down every 1 second
    const countdownFunction = setInterval(() => {
        // Get today's date and time
        const now = new Date().getTime();

        // Find the distance between now and the count down date
        const distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the corresponding elements
        document.getElementById("days").innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(countdownFunction);
            document.querySelector(".countdown-container").innerHTML = `<h2 style="font-family: ${pageCopy.countdownFont}; color: var(--primary-light); font-size: 2rem">${pageCopy.countdownDone}</h2>`;
        }
    }, 1000);

    // --- 3. Scroll Animation Logic (Intersection Observer) ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    fadeElements.forEach(el => {
        appearOnScroll.observe(el);
    });

    // --- 4. Hero Video Scroll Animation ---
    // heroVideo already declared above in section 0
    const heroSection = document.querySelector('.hero');

    // We only want to animate while the hero section is in view
    window.addEventListener('scroll', () => {
        if (!heroVideo) return;

        let scrollY = window.scrollY;

        // Use a fixed value or the actual height. Offset height sometimes loads 0 depending on timing, so fallback to window.innerHeight if needed.
        let heroHeight = heroSection.offsetHeight || window.innerHeight;

        // Stop calculating if scrolled past hero
        if (scrollY > heroHeight) return;

        // Calculate a scroll progress percentage (0 to 1)
        let progress = scrollY / heroHeight;

        // Visual Effects Mapping:
        // Scale: Starts at 1.05, shrinks down to 1.0
        let scaleVal = 1.05 - (0.05 * progress);

        // Blur: Starts at 0px, increases to 8px
        let blurVal = progress * 8;

        // Opacity: Starts at 1, fades to 0.4
        let opacityVal = 1 - (0.6 * progress);

        // Apply styles dynamically
        // Use translateZ(0) to force hardware acceleration for smoother rendering
        heroVideo.style.transform = `scale(${scaleVal}) translateZ(0)`;
        heroVideo.style.filter = `blur(${blurVal}px)`;
        heroVideo.style.opacity = opacityVal;
    });

    // --- 5. Add to Calendar Logic ---
    const addToCalendarBtn = document.getElementById('add-to-calendar');
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', () => {
            // Google Calendar Format
            const title = encodeURIComponent(pageCopy.calendarTitle);
            const details = encodeURIComponent(pageCopy.calendarDetails);
            const location = encodeURIComponent(pageCopy.calendarLocation);

            // The calendar event spans the full wedding day itinerary in IST.
            const startTime = "20260503T041500Z"; // 9:45 AM IST
            const endTime = "20260503T133000Z";   // 7:00 PM IST

            const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;

            window.open(googleCalUrl, '_blank');
        });
    }

    // --- 5. Share Invitation Logic ---
    const shareBtn = document.getElementById('share-website');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: pageCopy.shareTitle,
                        text: pageCopy.shareText,
                        url: window.location.href
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.log('Share failed:', err);
                    }
                }
            } else {
                // Fallback: Copy to clipboard
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    const originalText = shareBtn.innerHTML;
                    shareBtn.innerHTML = `<i class="fas fa-check"></i> ${pageCopy.copiedText}`;
                    setTimeout(() => { shareBtn.innerHTML = originalText; }, 2000);
                } catch (err) {
                    console.error('Failed to copy: ', err);
                }
            }
        });
    }

    // --- 6. Smart Maps Deep-Linking ---
    const mapLinks = document.querySelectorAll('.smart-maps-link');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    mapLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lat = link.getAttribute('data-lat');
            const lng = link.getAttribute('data-lng');
            const label = encodeURIComponent(link.getAttribute('data-label'));

            let mapUrl = "";
            if (isIOS) {
                // Apple Maps protocol
                mapUrl = `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`;

                // Set a timeout to fallback to browser if maps doesn't open
                const check = setTimeout(() => {
                    window.location.href = `https://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
                }, 500);
                window.location.href = mapUrl;
            } else {
                // Google Maps universal link
                mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(mapUrl, '_blank');
            }
        });
    });

    // --- 7. Gallery "View More" Logic ---
    const viewMoreBtn = document.getElementById('view-more-gallery');
    const hiddenItems = document.querySelectorAll('.gallery-item.mobile-hidden');

    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            hiddenItems.forEach(item => {
                item.classList.add('show-mobile');
            });
            // Hide the button after showing all
            viewMoreBtn.classList.add('hidden');
        });
    }

    // --- 8. QR Code Modal Logic (Desktop Fallback) ---
    const qrModal = document.getElementById('qr-modal');
    const closeBtn = document.querySelector('.close-btn');
    const qrBtns = document.querySelectorAll('.qr-btn');
    const qrContainer = document.getElementById('qr-container');
    const qrLabel = document.getElementById('qr-label');

    qrBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.getAttribute('data-url');
            const label = btn.getAttribute('data-label');

            qrLabel.innerText = label;
            qrContainer.innerHTML = '';

            // Generate QR Code
            new QRCode(qrContainer, {
                text: url,
                width: 200,
                height: 200,
                colorDark: "#2c3e50",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            qrModal.classList.add('show');
        });
    });

    if (closeBtn && qrModal) {
        closeBtn.addEventListener('click', () => {
            qrModal.classList.remove('show');
        });
    }

    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.classList.remove('show');
        }
    });

    // --- 8b. Transport Modal Logic ---
    const transportModal = document.getElementById('transport-modal');
    const transportBtns = document.querySelectorAll('.transport-btn');
    const transportClose = document.querySelector('.transport-close');
    const transportVenueName = document.getElementById('transport-venue-name');
    let currentVenue = 'Wedding';

    const venueRoutes = {
        Wedding: {
            bus: 'From Ernakulam → Take bus to Guruvayur via Thriprayar',
            train: 'Thrissur Railway Station (25km) / Guruvayur Railway Station (10km)',
            airport: 'Cochin International Airport (70km) → Taxi to venue (~2hrs)'
        },
        Reception: {
            bus: 'From (Thrissur Shakthan Stand / Irinjalakuda / Thriprayar) → Take bus to Kattoor → Walk to venue',
            train: 'Thrissur Railway Station (25km) / Irinjalakuda Railway Station (12km) → Taxi to venue',
            airport: 'Cochin International Airport (60km) → Taxi to venue (~1.5hr)'
        }
    };

    transportBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            currentVenue = btn.getAttribute('data-venue') || 'Wedding';
            transportVenueName.innerText = currentVenue === 'Reception' ?
                'Jubilee Convention Centre' : 'SHA International Auditorium';
            updateTransportRoutes();
            transportModal.classList.add('show');
        });
    });

    function updateTransportRoutes() {
        const cards = document.querySelectorAll('.transport-card');
        const routes = venueRoutes[currentVenue] || venueRoutes.Wedding;
        cards.forEach((card, index) => {
            const routeEl = card.querySelector('.transport-route');
            const types = ['bus', 'train', 'airport'];
            if (routeEl && routes[types[index]]) {
                routeEl.innerText = routes[types[index]];
            }
        });
    }

    if (transportClose && transportModal) {
        transportClose.addEventListener('click', () => {
            transportModal.classList.remove('show');
        });
    }

    transportModal.addEventListener('click', (e) => {
        if (e.target === transportModal) {
            transportModal.classList.remove('show');
        }
    });

    // --- 9. Full-Screen Photo Lightbox Logic ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const galleryGridItems = document.querySelectorAll('.gallery-item img');
    let currentIndex = 0;

    function showLightbox(index) {
        currentIndex = index;
        const item = galleryGridItems[currentIndex];
        lightboxImg.src = item.src;
        lightbox.classList.add('show');
        document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('show');
        document.body.classList.remove('lightbox-open');
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % galleryGridItems.length;
        updateLightboxImage();
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryGridItems.length) % galleryGridItems.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = galleryGridItems[currentIndex].src;
            lightboxImg.style.opacity = '1';
        }, 150);
    }

    const galleryCards = document.querySelectorAll('.gallery-item');

    galleryCards.forEach((card, index) => {
        card.addEventListener('click', () => showLightbox(index));
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.closest('.lightbox-content') === null) {
                closeLightbox();
            }
        });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('show')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    // Touch Swipe Support
    let touchstartX = 0;
    let touchendX = 0;

    if (lightbox) {
        lightbox.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            if (touchendX < touchstartX - 50) showNext();
            if (touchendX > touchstartX + 50) showPrev();
        }, { passive: true });
    }

});
