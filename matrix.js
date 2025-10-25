// javascript
document.addEventListener("DOMContentLoaded", function () {
    // Mark that JS is active (used for CSS fallback)
    document.documentElement.classList.add("js");

    // Snapshot keys per page
    const SNAP_KEY = 'snap:' + location.pathname;

    function isBackForwardNav() {
        try {
            const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
            if (nav && nav.type === 'back_forward') return true;
        } catch (e) {}
        // Deprecated fallback
        if (performance && performance.navigation && performance.navigation.type === 2) return true;
        return false;
    }

    function tryRestoreSnapshot() {
        try {
            const raw = sessionStorage.getItem(SNAP_KEY);
            if (!raw) return false;
            const texts = JSON.parse(raw);
            const spans = document.querySelectorAll('.typing span');
            if (!spans.length || !texts.length) return false;

            const len = Math.min(spans.length, texts.length);
            for (let i = 0; i < len; i++) {
                spans[i].textContent = texts[i];
                // Restore list bullets for links
                const a = spans[i].parentElement;
                if (a && a.tagName === 'A' && a.parentElement) {
                    a.parentElement.style.listStyle = 'disc';
                }
            }

            // Reveal images and remove any uploading helper
            document.querySelectorAll('.project img').forEach((img) => {
                const prev = img.previousElementSibling;
                if (prev && typeof prev.textContent === 'string' && prev.textContent.startsWith('Uploading image')) {
                    prev.remove();
                }
                img.classList.add('loaded');
            });

            // Reveal prompt/input if present
            const prompt = document.getElementById('command-prompt');
            const input = document.getElementById('command-input');
            if (prompt) prompt.style.visibility = 'visible';
            if (input) input.style.visibility = 'visible';

            // Keep a cursor blinking at the end to preserve the terminal feel
            if (spans[len - 1]) {
                spans[len - 1].innerHTML = spans[len - 1].textContent + '<span class="typing-cursor"></span>';
            }

            return true;
        } catch (e) {
            console.warn('Snapshot restore failed:', e);
            return false;
        }
    }

    function saveSnapshot() {
        try {
            const texts = Array.from(document.querySelectorAll('.typing span')).map((sp) => sp.textContent);
            sessionStorage.setItem(SNAP_KEY, JSON.stringify(texts));
        } catch (e) {
            console.warn('Snapshot save failed:', e);
        }
    }

    // Collect all typing spans
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    // Config: line durations (ms)
    const lineDurations = { normal: 200, fast: 100, turbo: 0 };
    const savedSpeed = localStorage.getItem("typistSpeed");
    let currentSpeedName = savedSpeed || "normal";

    // Controls
    let fastForwardHeld = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) currentSpeedName = "turbo";

    // Dedicated typing timer (do NOT reuse it for anything else)
    let typingTimer = null;

    // Controls: hold Shift for fast-forward; press 's' to skip the entire page; click toggles fast-forward
    document.addEventListener("keydown", (e) => {
        if (e.key === "Shift") fastForwardHeld = true;
        if (e.key && e.key.toLowerCase() === "s") skipEntirePage();
    });
    document.addEventListener("keyup", (e) => {
        if (e.key === "Shift") fastForwardHeld = false;
    });
    document.addEventListener("click", () => {
        fastForwardHeld = !fastForwardHeld;
    });

    // Optional: expose a function to set speed and persist
    window.setTypingSpeed = (name) => {
        if (lineDurations[name] !== undefined) {
            currentSpeedName = name;
            localStorage.setItem("typistSpeed", name);
        }
    };

    // Only for typing flow
    function scheduleTyping(fn, delay) {
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(fn, delay);
    }

    function typeText(element, text, index, stepChars, callback) {
        const finishLine = () => {
            element.innerHTML = text;

            // Keep your existing anchor/list logic
            if (element.parentElement && element.parentElement.tagName === "A") {
                const li = element.parentElement.parentElement;
                if (li) li.style.listStyle = "disc";
            }

            if (callback) {
                const isStartupMessage = element.closest("#startup-message");
                const isLastElement = currentElementIndex === elements.length - 1;
                const isLastStartupMessage =
                    isStartupMessage &&
                    element.textContent.includes("C:\\Google\\Github\\https://anthony-de-hoog.github.io/");
                const pauseDuration =
                    reducedMotion || fastForwardHeld || currentSpeedName === "turbo"
                        ? 0
                        : isLastStartupMessage || (!isStartupMessage && !isLastElement)
                            ? 350
                            : 0;

                scheduleTyping(() => {
                    // Continue typing flow
                    callback();

                    // Fallback: if image wasn't started yet, start it once
                    const projectDiv = element.closest(".project");
                    if (projectDiv && !projectDiv.dataset.imageStarted) {
                        projectDiv.dataset.imageStarted = "true";
                        const imgElement = projectDiv.querySelector("img");
                        if (imgElement) uploadImage(imgElement);
                    }
                }, pauseDuration);
            }
        };

        // Instant for reduced motion or turbo
        if (reducedMotion || currentSpeedName === "turbo") {
            finishLine();
            return;
        }

        // Chunk typing: complete in roughly the configured duration
        if (index < text.length) {
            const nextIndex = Math.min(index + stepChars, text.length);
            element.innerHTML =
                text.substring(0, nextIndex) + '<span class="typing-cursor"></span>';

            const delay = fastForwardHeld ? 0 : 16; // ~60fps
            scheduleTyping(() => typeText(element, text, nextIndex, stepChars, callback), delay);
        } else {
            finishLine();
        }
    }

    function startTyping(element, callback) {
        const text = element.getAttribute("data-text") || element.textContent || "";
        element.innerHTML = "";

        // Start image upload the first time we type anything in this project
        const projectDiv = element.closest(".project");
        if (projectDiv && !projectDiv.dataset.imageStarted) {
            projectDiv.dataset.imageStarted = "true";
            const imgElement = projectDiv.querySelector("img");
            if (imgElement) uploadImage(imgElement); // begins progress while text types
        }

        if (reducedMotion || currentSpeedName === "turbo" || fastForwardHeld) {
            // Finish instantly
            element.innerHTML = text;
            // mirror anchor/list logic
            if (element.parentElement && element.parentElement.tagName === "A") {
                const li = element.parentElement.parentElement;
                if (li) li.style.listStyle = "disc";
            }
            if (callback) callback();
            return;
        }

        // Compute step size so the line completes in ~lineDurations[currentSpeedName]
        const target = lineDurations[currentSpeedName];
        const frames = Math.max(1, Math.round(target / 16)); // ~60fps
        const stepChars = Math.max(1, Math.ceil(text.length / frames));
        typeText(element, text, 0, stepChars, callback);
    }

    function typeRemainingElements() {
        if (currentElementIndex < elements.length - 1) {
            const previousElement = elements[currentElementIndex];
            currentElementIndex++;
            previousElement.innerHTML = previousElement.textContent; // remove cursor from previous
            startTyping(elements[currentElementIndex], typeRemainingElements);
        } else {
            elements[currentElementIndex].innerHTML += '<span class="typing-cursor"></span>';
            if (document.querySelector("#boot-screen")) {
                // Independent redirect timer
                setTimeout(() => {
                    window.location.href = "Home.html";
                }, 100);
            }
            // Reveal the command prompt and input field after the typing effect
            const prompt = document.getElementById("command-prompt");
            const input = document.getElementById("command-input");
            if (prompt) prompt.style.visibility = "visible";
            if (input) input.style.visibility = "visible";

            // Save snapshot after everything finishes
            saveSnapshot();
        }
    }

    // Skip the entire page immediately (used by 's' key)
    function skipEntirePage() {
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        const spans = document.querySelectorAll(".typing span");
        if (!spans.length) return;

        for (let i = currentElementIndex; i < spans.length; i++) {
            const el = spans[i];
            const text = el.getAttribute("data-text") || el.textContent || "";
            el.innerHTML = text;

            if (el.parentElement && el.parentElement.tagName === "A") {
                const li = el.parentElement.parentElement;
                if (li) li.style.listStyle = "disc";
            }
        }

        // Reveal all project images and remove any pending "Uploading image…" helpers
        document.querySelectorAll(".project").forEach((project) => {
            project.dataset.imageStarted = "true";
            const img = project.querySelector("img");
            if (img) {
                const prev = img.previousElementSibling;
                if (prev && typeof prev.textContent === "string" && prev.textContent.startsWith("Uploading image")) {
                    prev.remove();
                }
                img.classList.add("loaded");
            }
        });

        currentElementIndex = spans.length - 1;
        spans[currentElementIndex].innerHTML += '<span class="typing-cursor"></span>';

        const prompt = document.getElementById("command-prompt");
        const input = document.getElementById("command-input");
        if (prompt) prompt.style.visibility = "visible";
        if (input) input.style.visibility = "visible";

        // Save snapshot of the fully revealed page
        saveSnapshot();
    }

    function uploadImage(imgElement, { instant = false } = {}) {
        if (!imgElement || !imgElement.src) {
            console.error("Image element or source missing:", imgElement);
            return;
        }

        // Add uploading helper below the image placeholder
        const loadingText = document.createElement("div");
        loadingText.textContent = "Uploading image █░░░░░░░░░ 10%";
        loadingText.style.color = "#00ff00";
        loadingText.style.marginTop = "10px";
        loadingText.style.fontSize = "14px";
        imgElement.before(loadingText);

        if (instant) {
            loadingText.remove();
            imgElement.classList.add("loaded");
            return;
        }

        const imgTest = new Image();
        imgTest.src = imgElement.src;
        imgTest.onload = function () {
            let progress = 10;
            const interval = setInterval(() => {
                progress += 10;
                loadingText.textContent = `Uploading image ${"█".repeat(progress / 10)}${"░".repeat(
                    10 - progress / 10
                )} ${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        loadingText.remove();
                        imgElement.classList.add("loaded");
                    }, 300);
                }
            }, 200);
        };

        imgTest.onerror = function () {
            console.error("Failed to load image:", imgElement.src);
            loadingText.textContent = "Error loading image ❌";
        };
    }

    // Unconditionally attempt restore BEFORE preparing spans
    const restored = tryRestoreSnapshot();

    // Prepare each typing span only if we didn't restore, then kick off typing
    if (!restored) {
        elements.forEach((element) => {
            element.setAttribute("data-text", element.textContent);
            element.innerHTML = "";
        });

        if (elements.length > 0) {
            startTyping(elements[currentElementIndex], typeRemainingElements);
        }
    }

    // If you use #main-content somewhere, keep this
    if (document.querySelector("#main-content")) {
        document.getElementById("main-content").style.display = "block";
    }

    // Terminal input handling (guard for pages without the input)
    const commandInput = document.getElementById("command-input");
    const commandSuggestions = document.getElementById("command-suggestions");

    if (commandInput) {
        commandInput.addEventListener("keydown", function (event) {
            if (event.key === "/") {
                if (commandSuggestions) commandSuggestions.style.display = "block";
            } else if (event.key === "Enter") {
                const command = commandInput.value.trim().toLowerCase();
                switch (command) {
                    case "home":
                        window.location.href = "Home.html";
                        break;
                    case "about me":
                        window.location.href = "AboutMe.html";
                        break;
                    case "projects":
                        window.location.href = "Projecten.html";
                        break;
                    case "contact":
                        window.location.href = "Contact.html";
                        break;
                    // Optional: make backtracking feel integrated
                    case "back":
                    case "b":
                    case "cd ..":
                        history.back();
                        break;
                    default:
                        alert("Unknown command: " + command);
                }
                commandInput.value = "";
                if (commandSuggestions) commandSuggestions.style.display = "none";
            } else {
                if (commandSuggestions) commandSuggestions.style.display = "none";
            }
        });
    }
});