// javascript
document.addEventListener("DOMContentLoaded", function () {
    // Mark that JS is active (used for CSS fallback)
    document.documentElement.classList.add("js");

    // Collect all typing spans
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    // Config: line durations (ms) rather than "ms per char"
    const lineDurations = { normal: 200, fast: 100, turbo: 0 };
    const saved = localStorage.getItem("typistSpeed");
    let currentSpeedName = saved || "normal";

    // Controls
    let fastForwardHeld = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) currentSpeedName = "turbo";

    // Dedicated typing timer (do NOT reuse this for image loading)
    let typingTimer = null;

    // Controls: hold Shift for fast-forward; press 's' to skip the entire page; click toggles fast-forward
    document.addEventListener("keydown", (e) => {
        if (e.key === "Shift") fastForwardHeld = true;
        if (e.key.toLowerCase() === "s") skipEntirePage();
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
                // Preserve your pause logic
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

                    // Fallback: if image wasn't started yet, start it now once
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
                // Do NOT use scheduleTyping here; keep it independent
                setTimeout(() => {
                    window.location.href = "Home.html";
                }, 100);
            }
            // Reveal the command prompt and input field after the typing effect
            const prompt = document.getElementById("command-prompt");
            const input = document.getElementById("command-input");
            if (prompt) prompt.style.visibility = "visible";
            if (input) input.style.visibility = "visible";
        }
    }

    // Skip the entire page immediately (used by 's' key)
    function skipEntirePage() {
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        if (!elements.length) return;

        for (let i = currentElementIndex; i < elements.length; i++) {
            const el = elements[i];
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

        currentElementIndex = elements.length - 1;
        elements[currentElementIndex].innerHTML += '<span class="typing-cursor"></span>';

        const prompt = document.getElementById("command-prompt");
        const input = document.getElementById("command-input");
        if (prompt) prompt.style.visibility = "visible";
        if (input) input.style.visibility = "visible";
    }

    function uploadImage(imgElement, { instant = false } = {}) {
        if (!imgElement || !imgElement.src) {
            console.error("Image element or source missing:", imgElement);
            return;
        }

        // Do NOT toggle display; rely on CSS opacity/transform to avoid flicker/layout shift
        // Ensure the loading text appears below the image placeholder
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
                    // IMPORTANT: use setTimeout, not scheduleTyping
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

    // Prepare each typing span
    elements.forEach((element) => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    // Kick off typing
    if (elements.length > 0) {
        startTyping(elements[currentElementIndex], typeRemainingElements);
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