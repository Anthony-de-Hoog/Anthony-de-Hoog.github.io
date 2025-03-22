document.addEventListener("DOMContentLoaded", function() {
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    function type(element, text, index) {
        if (index < text.length) {
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor">|</span>';
            setTimeout(() => type(element, text, index + 1), 20); // Adjusted typing speed here
        } else {
            element.innerHTML = text; // Remove typing cursor after typing is done
            if (element.parentElement.tagName === 'A') {
                element.parentElement.parentElement.style.listStyle = 'disc'; // Add dots when typing is done
            }
            if (currentElementIndex < elements.length - 1) {
                currentElementIndex++;
                startTyping(elements[currentElementIndex]);
            } else {
                element.innerHTML = text + '<span class="cursor"></span>'; // Add blinking cursor to the last element
            }
        }
    }

    function startTyping(element) {
        const text = element.getAttribute("data-text");
        element.innerHTML = ''; // Clear the element content
        type(element, text, 0);
    }

    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    if (elements.length > 0) {
        startTyping(elements[currentElementIndex]);
    }
});