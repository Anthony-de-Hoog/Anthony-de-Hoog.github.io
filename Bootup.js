document.addEventListener("DOMContentLoaded", function () {
    // Select all elements with the class 'typing' inside the 'boot-screen' div
    const elements = document.querySelectorAll("#boot-screen .typing");
    let currentElementIndex = 0;

    // Function to type text character by character
    function typeText(element, text, index, speed, callback) {
        if (index < text.length) {
            // Add the next character and a blinking cursor
            element.innerHTML = text.substring(0, index + 1) + '<span class="typing-cursor">_</span>';
            // Call the function again after a delay
            setTimeout(() => typeText(element, text, index + 1, speed, callback), speed);
        } else {
            // Remove the cursor after typing the complete text
            element.innerHTML = text;
            // Call the callback function after a short pause
            if (callback) setTimeout(callback, 2000);
        }
    }

    // Function to start typing text in an element
    function startTyping(element, speed, callback) {
        const text = element.getAttribute("data-text");
        // Clear the content of the element
        element.innerHTML = "";
        // Start typing the text
        typeText(element, text, 0, speed, callback);
    }

    // Function to type text in all elements one by one
    function typeRemainingElements() {
        if (currentElementIndex < elements.length - 1) {
            currentElementIndex++;
            // Start typing the next element
            startTyping(elements[currentElementIndex], 80, typeRemainingElements);
        } else {
            // Add a blinking cursor to the last element
            elements[currentElementIndex].innerHTML += '<span class="typing-block"></span>';
            // Redirect to 'Home.html' after a short pause
            setTimeout(() => {
                window.location.href = "Home.html";
            }, 2000);
        }
    }

    // Store the original text and clear the content of each element
    elements.forEach(element => {
        element.setAttribute("data-text", element.textContent);
        element.innerHTML = "";
    });

    // Start typing the first element
    if (elements.length > 0) {
        startTyping(elements[currentElementIndex], 80, typeRemainingElements);
    }
});