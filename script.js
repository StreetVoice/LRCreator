// Global variables
let lyricsTextarea, tagButton, exportButton, currentLineDiv, previewArea, resetButton, playPauseButton;
let lyrics = [];
let currentLineIndex = 0;
let wavesurfer;
let audioFileName = '';

// Initialize the application
function init() {
    lyricsTextarea = document.getElementById('lyrics-textarea');
    tagButton = document.getElementById('tag-button');
    exportButton = document.getElementById('export-button');
    currentLineDiv = document.getElementById('current-line');
    previewArea = document.getElementById('preview-area');
    resetButton = document.getElementById('reset-button');
    playPauseButton = document.getElementById('playPause');

    document.getElementById('audio-file').addEventListener('change', handleFileSelect);
    lyricsTextarea.addEventListener('input', handleLyricsInput);
    tagButton.addEventListener('click', tagCurrentLine);
    exportButton.addEventListener('click', exportLRC);
    resetButton.addEventListener('click', resetTagging);
    playPauseButton.addEventListener('click', togglePlayPause);

    tagButton.addEventListener('keydown', handleTagButtonKeydown);
    exportButton.addEventListener('keydown', handleExportButtonKeydown);
    document.addEventListener('keydown', handleKeyPress);

    initWavesurfer();
    loadSavedData();
}

function initWavesurfer() {
    console.log('Initializing WaveSurfer');
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        responsive: true,
        interact: true,
        plugins: [
            WaveSurfer.cursor.create({
                showTime: true,
                opacity: 1,
                customShowTimeStyle: {
                    'background-color': '#000',
                    color: '#fff',
                    padding: '2px',
                    'font-size': '10px'
                }
            })
        ]
    });

    wavesurfer.on('ready', function () {
        console.log('WaveSurfer is ready');
        playPauseButton.disabled = false;
        playPauseButton.textContent = 'Play';
    });

    wavesurfer.on('error', function(e) {
        console.error('WaveSurfer error:', e);
        alert('Error loading audio file. Please try again with a different file.');
    });

    wavesurfer.on('loading', function(percent) {
        console.log('Loading audio:', percent + '%');
        playPauseButton.textContent = 'Loading...';
        playPauseButton.disabled = true;
    });
}

function togglePlayPause() {
    if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
        playPauseButton.textContent = 'Play';
    } else {
        wavesurfer.play();
        playPauseButton.textContent = 'Pause';
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
        audioFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        const objectURL = URL.createObjectURL(file);
        wavesurfer.load(objectURL);
        playPauseButton.disabled = true;
        playPauseButton.textContent = 'Loading...';
    }
}

function handleKeyPress(event) {
    // Check if the pressed key is 'T' or 't'
    if (event.key === 'T' || event.key === 't') {
        // Prevent the default action (e.g., typing 't' in an input field)
        event.preventDefault();
        // Call the tagCurrentLine function
        tagCurrentLine();
    }
}

function handleTagButtonKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        tagCurrentLine();
    }
}

function handleExportButtonKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        exportLRC();
    }
}

function handleLyricsInput() {
    const newLyrics = lyricsTextarea.value.split('\n').filter(line => line.trim() !== '');
    
    lyrics = newLyrics.map(line => line.trim());
    
    // Find the first untagged line
    currentLineIndex = lyrics.findIndex(line => !line.match(/^\[\d{2}:\d{2}\.\d{2}\]/));
    if (currentLineIndex === -1) {
        currentLineIndex = lyrics.length; // All lines are tagged
    }

    updateCurrentLine();
    saveLyrics();
}

function resetTagging() {
    lyrics = lyrics.map(line => line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, ''));
    currentLineIndex = 0;
    updateLyricsTextarea();
    updateCurrentLine();
    saveLyrics();
}

function tagCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        const currentTime = wavesurfer.getCurrentTime();
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const milliseconds = Math.floor((currentTime % 1) * 100);
        const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
        
        lyrics[currentLineIndex] = timestamp + lyrics[currentLineIndex].replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '');
        
        // Move to the next untagged line
        currentLineIndex = lyrics.findIndex((line, index) => index > currentLineIndex && !line.match(/^\[\d{2}:\d{2}\.\d{2}\]/));
        if (currentLineIndex === -1) {
            currentLineIndex = lyrics.length; // All subsequent lines are tagged
        }

        updateLyricsTextarea();
        updateCurrentLine();
        saveLyrics();
    }
}

function updateLyricsTextarea() {
    lyricsTextarea.value = lyrics.join('\n');
}

function updateCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        const lineWithoutTag = lyrics[currentLineIndex].replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '');
        currentLineDiv.textContent = `Current line: ${lineWithoutTag}`;
        tagButton.disabled = false;
    } else {
        currentLineDiv.textContent = 'All lines tagged';
        tagButton.disabled = true;
    }
    
    // Check if all lines are tagged
    const allTagged = lyrics.every(line => /^\[\d{2}:\d{2}\.\d{2}\]/.test(line));
    exportButton.disabled = !allTagged;

    tagButton.setAttribute('aria-label', tagButton.disabled ? 'All lines tagged' : `Tag line: ${currentLineDiv.textContent}`);
    exportButton.setAttribute('aria-label', exportButton.disabled ? 'Export not available yet' : 'Export LRC file');
}

function exportLRC() {
    const lrcContent = lyrics.join('\n');
    const blob = new Blob([lrcContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use the audio file name for the exported file, or a default name if no file was selected
    const exportFileName = audioFileName ? `${audioFileName}.txt` : 'lyrics.txt';
    a.download = exportFileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updatePreview(lrcContent);
}

function updatePreview(lrcContent) {
    previewArea.innerHTML = '';
    const lines = lrcContent.split('\n');
    lines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        previewArea.appendChild(p);
    });
}

function saveLyrics() {
    localStorage.setItem('lrcCreatorLyrics', JSON.stringify(lyrics));
    localStorage.setItem('lrcCreatorCurrentIndex', currentLineIndex.toString());
}

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

document.addEventListener('DOMContentLoaded', init);
