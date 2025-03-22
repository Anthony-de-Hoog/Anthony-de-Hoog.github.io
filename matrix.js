document.addEventListener("DOMContentLoaded", function () {
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    function typeText(element, text, index, speed, callback) {
        if (index < text.length) {
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor">_</span>';
            setTimeout(() => typeText(element, text, index + 1, speed, callback), speed);
        } else {
            element.innerHTML = text; // Remove the cursor after typing
            if (element.parentElement.tagName === 'A') {
                element.parentElement.parentElement.style.listStyle = 'disc'; // Add dots after typing
            }
            if (callback) callback();
        }
    }

    function startTyping(element, speed, callback) {
        const text = element.getAttribute("data-text");
        element.innerHTML = ""; // Clear the content
        typeText(element, text, 0, speed, callback);
    }

    function typeRemainingElements() {
        if (currentElementIndex < elements.length - 1) {
            currentElementIndex++;
            const speed = elements[currentElementIndex].closest("#startup-message") ? 5 : 30;
            startTyping(elements[currentElementIndex], speed, typeRemainingElements);
        } else {
            elements[currentElementIndex].innerHTML += '<span class="typing-block"></span>'; // Blinking cursor at the end
            if (document.querySelector("#boot-screen")) {
                setTimeout(() => {
                    window.location.href = "Home.html"; // Switch to home after boot-up
                }, 2000); // Wait 2 seconds after typing is done
            }
        }
    }

    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    if (elements.length > 0) {
        const initialSpeed = elements[currentElementIndex].closest("#startup-message") ? 5 : 30;
        startTyping(elements[currentElementIndex], initialSpeed, typeRemainingElements);
    }

    if (document.querySelector("#main-content")) {
        document.getElementById("main-content").style.display = "block"; // Show the main content
    }
});