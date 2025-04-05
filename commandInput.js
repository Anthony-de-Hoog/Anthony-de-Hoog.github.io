document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('custom-command-input');
    const caret = document.createElement('div');
    caret.className = 'custom-caret';
    commandInput.appendChild(caret);

    commandInput.addEventListener('input', () => {
        caret.style.left = `${commandInput.textContent.length * 10}px`;
    });

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Handle command execution here
            console.log('Command executed:', commandInput.textContent);
            commandInput.textContent = '';
            caret.style.left = '0px';
        }
    });
});