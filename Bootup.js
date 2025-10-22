document.addEventListener("DOMContentLoaded", function () {
    // Collect the boot lines
    const elements = document.querySelectorAll("#boot-screen .typing");
    let currentElementIndex = 0;

    // Config: per-char speed and pauses
    const charDelayMs = 80;        // typing speed per character
    const delayAfterLineMs = 2000; // pause after each line (restored to a few seconds)
    const redirectDelayMs = 2000;  // pause after the last line before redirect

    // Dedicated typing timer so we can cancel cleanly on skip
    let typingTimer = null;
    let skipBoot = false;

    function scheduleTyping(fn, delay) {
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(fn, delay);
    }

    // Press 's' to skip the entire boot and go to Home.html immediately
    function skipBootNow() {
        skipBoot = true;
        if (typingTimer) clearTimeout(typingTimer);
        window.location.href = "Home.html";
    }

    document.addEventListener("keydown", (e) => {
        if (e.key && e.key.toLowerCase() === "s") {
            skipBootNow();
        }
    });

    function typeText(element, text, index, speed, callback) {
        if (skipBoot) return; // if we skipped, stop typing immediately

        if (index < text.length) {
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor"></span>';
            scheduleTyping(() => typeText(element, text, index + 1, speed, callback), speed);
        } else {
            element.innerHTML = text + '<span class="typing-cursor"></span>';
            if (callback) scheduleTyping(callback, delayAfterLineMs); // restored longer pause
        }
    }

    function startTyping(element, speed, callback) {
        const text = element.getAttribute("data-text");
        element.innerHTML = "";
        typeText(element, text, 0, speed, callback);
    }

    function typeRemainingElements() {
        if (skipBoot) return;

        if (currentElementIndex < elements.length - 1) {
            const previousElement = elements[currentElementIndex];
            currentElementIndex++;
            // remove cursor from previous line
            previousElement.innerHTML = previousElement.textContent;
            startTyping(elements[currentElementIndex], charDelayMs, typeRemainingElements);
        } else {
            // After the last line, redirect as before (with a pause)
            scheduleTyping(() => {
                if (!skipBoot) window.location.href = "Home.html";
            }, redirectDelayMs);
        }
    }

    // Initialize lines
    elements.forEach((element) => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    if (elements.length > 0) {
        startTyping(elements[currentElementIndex], charDelayMs, typeRemainingElements);
    }
});