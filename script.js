// Global variables
let audioElement, lyricsTextarea, tagButton, exportButton, currentLineDiv;
let lyrics = [];
let currentLineIndex = 0;

// Initialize the application
function init() {
    audioElement = document.getElementById('audio-element');
    lyricsTextarea = document.getElementById('lyrics-textarea');
    tagButton = document.getElementById('tag-button');
    exportButton = document.getElementById('export-button');
    currentLineDiv = document.getElementById('current-line');

    document.getElementById('audio-file').addEventListener('change', handleFileSelect);
    lyricsTextarea.addEventListener('input', handleLyricsInput);
    tagButton.addEventListener('click', tagCurrentLine);
    exportButton.addEventListener('click', exportLRC);

    loadSavedData();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audioElement.src = objectURL;
    }
}

// Handle lyrics input
function handleLyricsInput() {
    lyrics = lyricsTextarea.value.split('\n').filter(line => line.trim() !== '');
    updateCurrentLine();
    saveLyrics();
}

// Tag the current line with timestamp
function tagCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        const currentTime = audioElement.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const milliseconds = Math.floor((currentTime % 1) * 100);
        const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
        
        lyrics[currentLineIndex] = `${timestamp}${lyrics[currentLineIndex]}`;
        currentLineIndex++;
        updateLyricsTextarea();
        updateCurrentLine();
        saveLyrics();
    }
}

// Update the lyrics textarea
function updateLyricsTextarea() {
    lyricsTextarea.value = lyrics.join('\n');
}

// Update the current line display
function updateCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        currentLineDiv.textContent = lyrics[currentLineIndex];
        tagButton.disabled = false;
    } else {
        currentLineDiv.textContent = 'All lines tagged';
        tagButton.disabled = true;
    }
    exportButton.disabled = currentLineIndex < lyrics.length;
}

// Export LRC file
function exportLRC() {
    const lrcContent = lyrics.join('\n');
    const blob = new Blob([lrcContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.lrc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Save lyrics to localStorage
function saveLyrics() {
    localStorage.setItem('lrcCreatorLyrics', JSON.stringify(lyrics));
    localStorage.setItem('lrcCreatorCurrentIndex', currentLineIndex.toString());
}

// Load saved data from localStorage
function loadSavedData() {
    const savedLyrics = localStorage.getItem('lrcCreatorLyrics');
    const savedIndex = localStorage.getItem('lrcCreatorCurrentIndex');
    
    if (savedLyrics) {
        lyrics = JSON.parse(savedLyrics);
        lyricsTextarea.value = lyrics.join('\n');
    }
    
    if (savedIndex) {
        currentLineIndex = parseInt(savedIndex, 10);
    }
    
    updateCurrentLine();
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
