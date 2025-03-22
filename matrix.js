document.addEventListener("DOMContentLoaded", function() {
    const elements = document.querySelectorAll(".typing span");
    let currentElementIndex = 0;

    function type(element, text, index) {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            setTimeout(() => type(element, text, index + 1), 100); // Adjust typing speed here
        } else {
            if (currentElementIndex < elements.length - 1) {
                element.parentElement.classList.remove("typing-active");
                currentElementIndex++;
                startTyping(elements[currentElementIndex]);
            } else {
                element.parentElement.classList.add("typing-active");
            }
        }
    }

    function startTyping(element) {
        const text = element.getAttribute("data-text");
        element.textContent = "";
        element.parentElement.classList.add("typing-active");
        type(element, text, 0);
    }

    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.textContent = "";
        element.parentElement.classList.remove("typing-active");
    });

    if (elements.length > 0) {
        startTyping(elements[currentElementIndex]);
    }
});