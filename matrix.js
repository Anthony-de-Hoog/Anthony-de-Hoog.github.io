document.addEventListener("DOMContentLoaded", function () {
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    function typeText(element, text, index, speed, callback) {
        if (index < text.length) {
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor"></span>';
            setTimeout(() => typeText(element, text, index + 1, speed, callback), speed);
        } else {
            element.innerHTML = text;
            if (element.parentElement.tagName === 'A') {
                element.parentElement.parentElement.style.listStyle = 'disc';
            }

            if (callback) {
                const isStartupMessage = element.closest("#startup-message");
                const isLastElement = currentElementIndex === elements.length - 1;
                const isLastStartupMessage = isStartupMessage && element.textContent.includes("C:\\Google\\Github\\https://anthony-de-hoog.github.io/");
                const pauseDuration = isLastStartupMessage || (!isStartupMessage && !isLastElement) ? 850 : 0;

                setTimeout(() => {
                    callback();

                    // Check if this is the last element inside its .project div
                    const projectDiv = element.closest(".project");
                    if (projectDiv) {
                        const lastTypingElement = projectDiv.querySelector(".typing span:last-of-type");
                        if (element === lastTypingElement) {
                            const imgElement = projectDiv.querySelector("img");
                            if (imgElement) uploadImage(imgElement);
                        }
                    }
                }, pauseDuration);
            }
        }
    }

    function startTyping(element, speed, callback) {
        const text = element.getAttribute("data-text");
        element.innerHTML = "";
        typeText(element, text, 0, speed, callback);
    }

    function typeRemainingElements() {
        if (currentElementIndex < elements.length - 1) {
            const previousElement = elements[currentElementIndex];
            currentElementIndex++;
            const speed = elements[currentElementIndex].closest("#startup-message") ? 5 : 10;
            previousElement.innerHTML = previousElement.textContent;
            startTyping(elements[currentElementIndex], speed, typeRemainingElements);
        } else {
            elements[currentElementIndex].innerHTML += '<span class="typing-cursor"></span>';
            if (document.querySelector("#boot-screen")) {
                setTimeout(() => {
                    window.location.href = "Home.html";
                }, 100);
            }
        }
    }

    function uploadImage(imgElement) {
        if (!imgElement || !imgElement.src) {
            console.error("Image element or source missing:", imgElement);
            return;
        }

        // Hide image initially
        imgElement.style.display = "none"; // Now the image is completely hidden on page load

        const container = imgElement.parentElement;
        const loadingText = document.createElement("div");
        loadingText.textContent = "Uploading image █░░░░░░░░░ 10%";
        loadingText.style.color = "#00ff00"; // Match the green theme
        loadingText.style.marginTop = "10px"; // Adjust spacing
        loadingText.style.fontSize = "14px"; // Ensure it's readable

        // Insert loading animation **where the image is**
        imgElement.before(loadingText);

        let imgTest = new Image();
        imgTest.src = imgElement.src;
        imgTest.onload = function () {
            let progress = 10;
            const interval = setInterval(() => {
                progress += 10;
                loadingText.textContent = `Uploading image ${'█'.repeat(progress / 10)}${'░'.repeat(10 - progress / 10)} ${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        loadingText.remove();

                        // Show the image without fading in
                        imgElement.style.display = "block";
                        imgElement.style.opacity = "1";
                        imgElement.style.transform = "translateY(0)";
                    }, 500);
                }
            }, 300);
        };

        imgTest.onerror = function () {
            console.error("Failed to load image:", imgElement.src);
            loadingText.textContent = "Error loading image ❌";
        };
    }

    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    if (elements.length > 0) {
        const initialSpeed = elements[currentElementIndex].closest("#startup-message") ? 5 : 21;
        startTyping(elements[currentElementIndex], initialSpeed, typeRemainingElements);
    }

    if (document.querySelector("#main-content")) {
        document.getElementById("main-content").style.display = "block";
    }
});
