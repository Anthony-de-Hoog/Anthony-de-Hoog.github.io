(function () {
    function enableLightbox(selector = '.zoomable') {
        // Create overlay once
        const overlay = document.createElement('div');
        overlay.className = 'lightbox';
        const img = document.createElement('img');
        overlay.appendChild(img);
        overlay.addEventListener('click', (e) => {
            // Close on overlay click (but ignore clicks directly on the image)
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
        document.body.appendChild(overlay);

        function open(src) {
            img.src = src;
            document.body.classList.add('lightbox-open');
            overlay.classList.add('open');
        }

        function close() {
            overlay.classList.remove('open');
            document.body.classList.remove('lightbox-open');
            // Optional: clear src to free memory on very large images
            // img.removeAttribute('src');
        }

        document.querySelectorAll(selector).forEach((thumb) => {
            thumb.style.cursor = 'zoom-in';
            thumb.addEventListener('click', (e) => {
                e.preventDefault();
                // Use data-fullsrc if provided; fall back to current src
                const fullSrc = thumb.getAttribute('data-fullsrc') || thumb.currentSrc || thumb.src;
                open(fullSrc);
            });
        });
    }

    // Expose globally
    window.enableLightbox = enableLightbox;
})();