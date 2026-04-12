const starsContainer = document.getElementById("stars");
const petalsContainer = document.getElementById("petals");
const celebrationContainer = document.getElementById("celebration");
const root = document.documentElement;
const groom = document.getElementById("groom");
const bride = document.getElementById("bride");
const returnUnion = document.getElementById("return-union");
const ceremonyScene = document.getElementById("ceremony-scene");
const receptionScene = document.getElementById("reception-scene");
const sceneTitle = document.querySelector(".scene-title");
const welcomeLine = document.getElementById("welcome-line");
const weddingDateLine = document.getElementById("wedding-date-line");
const journeyLine = document.querySelector(".journey-line");
const scrollPrompt = document.querySelector(".scroll-prompt");
const ceremonyBackdrop = document.querySelector(".ceremony-backdrop");
const backgroundLayers = Array.from(document.querySelectorAll(".bg-layer"));
const cloudLayers = Array.from(document.querySelectorAll(".cloud"));
let latestProgress = 0;
let animationStarted = false;
let receptionLightTimer = null;
let previousProgress = 0;
let scrollDirection = 1;
let hasReachedJourneyStage = false;

[groom, bride].forEach((character) => {
    if (!character) {
        return;
    }

    character.tabIndex = 0;
    const showBubble = () => {
        character.classList.add("is-speaking");
    };

    const hideBubble = () => {
        character.classList.remove("is-speaking");
    };

    const toggleBubble = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = character.classList.contains("is-speaking");
        [groom, bride].forEach((entry) => {
            if (entry && entry !== character) {
                entry.classList.remove("is-speaking");
            }
        });
        if (!isOpen) {
            showBubble();
        } else {
            hideBubble();
        }
    };

    character.addEventListener("pointerenter", showBubble);
    character.addEventListener("mouseenter", showBubble);
    character.addEventListener("mouseleave", hideBubble);
    character.addEventListener("focus", showBubble);
    character.addEventListener("blur", hideBubble);
    character.addEventListener("pointerdown", toggleBubble);
});

document.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".character")) {
        return;
    }

    [groom, bride].forEach((character) => {
        if (!character) {
            return;
        }

        character.classList.remove("is-speaking");
    });
});

if (receptionScene) {
    const lightUpReception = () => {
        receptionScene.classList.add("is-lit");
        if (receptionLightTimer) {
            clearTimeout(receptionLightTimer);
            receptionLightTimer = null;
        }
    };

    const dimReception = () => {
        if (receptionLightTimer) {
            clearTimeout(receptionLightTimer);
        }
        receptionLightTimer = window.setTimeout(() => {
            receptionScene.classList.remove("is-lit");
        }, 900);
    };

    receptionScene.addEventListener("pointerenter", lightUpReception);
    receptionScene.addEventListener("pointermove", lightUpReception);
    receptionScene.addEventListener("pointerleave", dimReception);
    receptionScene.addEventListener("pointerdown", lightUpReception);
    receptionScene.addEventListener("touchstart", lightUpReception, { passive: true });
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mapRange = (value, start, end) => clamp((value - start) / (end - start));
function createStars() {
    if (!starsContainer) {
        return;
    }

    for (let index = 0; index < 40; index += 1) {
        const star = document.createElement("span");
        star.className = "star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 34}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${2.5 + Math.random() * 3}s`;
        starsContainer.appendChild(star);
    }
}

function createPetals() {
    for (let index = 0; index < 56; index += 1) {
        const petal = document.createElement("span");
        petal.className = `petal${index % 5 === 0 ? " golden" : ""}`;
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `${Math.random() * 100}%`;
        petalsContainer.appendChild(petal);
    }
}

function createConfetti() {
    if (!celebrationContainer) {
        return;
    }

    for (let index = 0; index < 28; index += 1) {
        const piece = document.createElement("span");
        piece.className = `confetti${index % 5 === 0 ? " round" : ""}`;
        piece.style.left = `${Math.random() * 100}%`;
        celebrationContainer.appendChild(piece);
    }
}

function updatePetals(progress, timeMs) {
    Array.from(petalsContainer.children).forEach((petal, index) => {
        const ceremonyLocal = Math.max(0, progress - 0.68);
        const receptionLocal = Math.max(0, progress - 0.84);
        const time = timeMs * 0.001;
        const showerBoost = (ceremonyLocal * 1800) + (receptionLocal * 2600);
        const drift = time * (36 + (index % 6) * 7 + (receptionLocal * 28));
        const y = ((progress * 1400) + drift + (index * 52) + showerBoost) % (window.innerHeight + 240);
        const x = Math.sin((progress * 14) + time + index) * (48 + ceremonyLocal * 58 + receptionLocal * 92);
        const rotate = (progress * 720) + (time * 120) + (index * 12) + (ceremonyLocal * 520) + (receptionLocal * 340);
        const scale = 0.8 + ((index % 5) * 0.08) + (ceremonyLocal * 0.3) + (receptionLocal * 0.32);
        const receptionColors = [
            "linear-gradient(135deg, rgba(255, 214, 120, 0.98), rgba(222, 157, 61, 0.66))",
            "linear-gradient(135deg, rgba(246, 153, 198, 0.96), rgba(200, 89, 145, 0.62))",
            "linear-gradient(135deg, rgba(160, 222, 255, 0.96), rgba(86, 133, 255, 0.58))",
            "linear-gradient(135deg, rgba(186, 255, 205, 0.96), rgba(68, 198, 125, 0.56))",
            "linear-gradient(135deg, rgba(255, 187, 135, 0.98), rgba(236, 123, 71, 0.6))",
        ];

        if (receptionLocal > 0.02) {
            petal.style.background = receptionColors[index % receptionColors.length];
        } else if (petal.classList.contains("golden")) {
            petal.style.background = "linear-gradient(135deg, rgba(255, 232, 166, 0.96), rgba(219, 171, 66, 0.58))";
        } else {
            petal.style.background = "linear-gradient(135deg, rgba(237, 170, 193, 0.92), rgba(200, 106, 143, 0.45))";
        }

        petal.style.transform = `translate3d(${x}px, ${y - 120}px, 0) rotate(${rotate}deg)`;
        petal.style.transform += ` scale(${scale})`;
        petal.style.opacity = String(Math.min(1, 0.28 + (ceremonyLocal * 2.2) + (receptionLocal * 1.8)));
    });
}

function updateConfetti(progress, intensity, timeMs) {
    if (!celebrationContainer) {
        return;
    }

    Array.from(celebrationContainer.children).forEach((piece, index) => {
        const local = Math.max(0, progress - 0.68);
        const time = timeMs * 0.001;
        const y = ((local * 1800) + (time * (80 + (index % 5) * 16)) + (index * 58)) % (window.innerHeight + 160);
        const x = Math.sin((local * 18) + (time * 1.8) + index) * (20 + (index % 4) * 8);
        const rotate = (local * 1080) + (time * 180) + (index * 32);
        piece.style.transform = `translate3d(${x}px, ${y - 140}px, 0) rotate(${rotate}deg)`;
        piece.style.opacity = String(intensity);
    });
}

function renderScene(timeMs = 0) {
    const progress = latestProgress;

    root.style.setProperty("--scroll-progress", progress.toFixed(4));

    backgroundLayers.forEach((layer, index) => {
        const depth = 120 + (index * 60);
        const moveY = -(progress * depth);
        const scale = 1 + (progress * (index === 0 ? 0.04 : 0.02));
        layer.style.transform = `translate3d(0, ${moveY}px, 0) scale(${scale})`;
    });

    cloudLayers.forEach((cloud, index) => {
        const x = Math.sin((progress * 8) + index) * 34;
        const y = -(progress * (24 + index * 10));
        cloud.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    const introHold = 1 - mapRange(progress, 0.18, 0.3);
    const pageTwoTravel = mapRange(progress, 0.24, 0.56);
    const ceremonyAppear = mapRange(progress, 0.58, 0.74);
    const ceremonyFadeOut = 1 - mapRange(progress, 0.78, 0.9);
    const receptionAppear = mapRange(progress, 0.9, 0.995);
    const titleFade = 1 - mapRange(progress, 0.16, 0.28);
    const journeyFade = 1 - mapRange(progress, 0.52, 0.64);
    const celebrationBurst = mapRange(progress, 0.58, 0.78);
    const introFadeOut = 1 - mapRange(progress, 0.54, 0.68);
    const hideSplitOnReturn = hasReachedJourneyStage && scrollDirection < 0 && progress < 0.56;

    const coneDrop = pageTwoTravel * 240;
    const returnUnionAppear = hasReachedJourneyStage && scrollDirection < 0
        ? mapRange(progress, 0.14, 0.03)
        : 0;
    
    // Responsive conePull - use smaller values on mobile but keep the cone motion visible
    const isMobile = window.innerWidth <= 768;
    const isPhone = window.innerWidth <= 560;
    const conePull = pageTwoTravel * (isPhone ? 6 : (isMobile ? 10 : 28));
    const spreadScale = 1 + (pageTwoTravel * (isPhone ? 0.04 : (isMobile ? 0.05 : 0.06)));

    groom.style.transform = `
        translate3d(${conePull}vw, ${coneDrop}px, 0)
        scale(${spreadScale})
    `;
    groom.style.opacity = String(
        hideSplitOnReturn
            ? 0
            : ((((0.6 * introHold) + (pageTwoTravel * 0.4) + 0.35) * introFadeOut) * (1 - returnUnionAppear))
    );

    bride.style.transform = `
        translate3d(${-conePull}vw, ${coneDrop}px, 0)
        scale(${spreadScale})
    `;
    bride.style.opacity = String(
        hideSplitOnReturn
            ? 0
            : ((((0.6 * introHold) + (pageTwoTravel * 0.4) + 0.35) * introFadeOut) * (1 - returnUnionAppear))
    );

    if (returnUnion) {
        returnUnion.style.opacity = String(returnUnionAppear);
        returnUnion.style.transform = `
            translate3d(-50%, ${160 - (returnUnionAppear * 210)}px, 0)
            scale(${0.86 + (returnUnionAppear * 0.16)})
        `;
    }

    sceneTitle.style.opacity = String(titleFade);
    sceneTitle.style.transform = `translate3d(-50%, ${-(progress * 100)}px, 0)`;
    if (welcomeLine) {
        welcomeLine.classList.toggle("is-visible", returnUnionAppear > 0.26);
        Array.from(welcomeLine.querySelectorAll("span")).forEach((letter, index) => {
            if (letter.classList.contains("welcome-gap")) {
                letter.style.animationDelay = "0s";
                return;
            }
            letter.style.animationDelay = `${0.05 * index}s`;
        });
    }

    if (weddingDateLine) {
        weddingDateLine.classList.toggle("is-visible", returnUnionAppear > 0.26);
        Array.from(weddingDateLine.querySelectorAll("span")).forEach((letter, index) => {
            if (letter.classList.contains("date-gap")) {
                letter.style.animationDelay = "0s";
                return;
            }
            letter.style.animationDelay = `${0.08 + (0.05 * index)}s`;
        });
    }

    journeyLine.style.opacity = String(journeyFade);
    root.style.setProperty("--ceremony-glow", celebrationBurst.toFixed(3));
    root.style.setProperty("--ceremony-shift", (ceremonyAppear * ceremonyFadeOut).toFixed(3));
    root.style.setProperty("--celebration-boost", celebrationBurst.toFixed(3));
    root.style.setProperty("--reception-progress", receptionAppear.toFixed(3));
    if (ceremonyBackdrop) {
        ceremonyBackdrop.style.opacity = String(ceremonyAppear * ceremonyFadeOut);
    }

    ceremonyScene.style.opacity = String(ceremonyAppear * ceremonyFadeOut);
    ceremonyScene.style.transform = `
        translate3d(-50%, ${100 - (ceremonyAppear * 100) + ((1 - ceremonyFadeOut) * 40)}px, 0)
        scale(${0.82 + (ceremonyAppear * 0.18)})
    `;

    if (receptionScene) {
        receptionScene.style.opacity = String(receptionAppear);
        receptionScene.style.pointerEvents = receptionAppear > 0.16 ? "auto" : "none";
        receptionScene.style.transform = `
            translate3d(0, ${60 - (receptionAppear * 60)}px, 0)
            scale(${0.94 + (receptionAppear * 0.06)})
        `;
    }

    scrollPrompt.style.opacity = String(1 - clamp(progress * 2.2));
    updatePetals(progress, timeMs);
    updateConfetti(progress, ceremonyAppear, timeMs);
    window.requestAnimationFrame(renderScene);
}

createStars();
createPetals();
createConfetti();
{
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    latestProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    previousProgress = latestProgress;
}
if (!animationStarted) {
    animationStarted = true;
    window.requestAnimationFrame(renderScene);
}

window.addEventListener("scroll", () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    previousProgress = latestProgress;
    latestProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    scrollDirection = latestProgress < previousProgress ? -1 : 1;
    if (latestProgress > 0.3) {
        hasReachedJourneyStage = true;
    }
}, { passive: true });

window.addEventListener("resize", () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    latestProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    previousProgress = latestProgress;
    
    // Force re-render to update responsive values
    if (animationStarted) {
        window.requestAnimationFrame(renderScene);
    }
});
