document.addEventListener('DOMContentLoaded', () => {

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
    // Set the date we're counting down to: May 3, 2026, 10:00:00 AM (IST roughly, or just local time)
    const countDownDate = new Date("May 3, 2026 10:00:00").getTime();

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
            document.querySelector(".countdown-container").innerHTML = "<h2 style='font-family: var(--font-heading); color: var(--primary-light); font-size: 2rem'>It's Our Wedding Day!</h2>";
        }
    }, 1000);

    // --- 3. Scroll Animation Logic (Intersection Observer) ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
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

    // --- 4. Add to Calendar Logic ---
    const addToCalendarBtn = document.getElementById('add-to-calendar');
    addToCalendarBtn.addEventListener('click', () => {
        // Google Calendar Format
        const title = encodeURIComponent("Ashith & Sujishna's Wedding");
        const details = encodeURIComponent("Join us to celebrate our wedding! \n\nWedding: 10:00 AM at Shaa International, Chettuva \nReception: 5:00 PM at Jubily Hall, Katoor");
        const location = encodeURIComponent("Shaa International, Chettuva, Kerala");
        
        // Dates must be in format YYYYMMDDTHHmmssZ (UTC time) or just YYYYMMDD/YYYYMMDD for whole day
        // Using local timezone offset format roughly for May 3 2026:
        const startTime = "20260503T043000Z"; // Approx 10:00 AM IST in UTC (subtract 5.5 hours)
        const endTime = "20260503T163000Z";   // Approx 10:00 PM IST in UTC

        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
        
        window.open(googleCalUrl, '_blank');
    });

});
