document.addEventListener("DOMContentLoaded", function () {
    const elements = document.querySelectorAll("#boot-screen .typing");
    let currentElementIndex = 0;

    function typeText(element, text, index, speed, callback) {
        if (index < text.length) {
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor"></span>';
            setTimeout(() => typeText(element, text, index + 1, speed, callback), speed);
        } else {
            element.innerHTML = text + '<span class="typing-cursor"></span>';
            if (callback) setTimeout(callback, 2000);
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
            previousElement.innerHTML = previousElement.textContent; // Remove cursor from previous line
            startTyping(elements[currentElementIndex], 80, typeRemainingElements);
        } else {
            setTimeout(() => {
                window.location.href = "Home.html";
            }, 2000);
        }
    }

    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    if (elements.length > 0) {
        startTyping(elements[currentElementIndex], 80, typeRemainingElements);
    }
});