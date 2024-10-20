// Global variables
let audioElement, lyricsTextarea, tagButton, exportButton, currentLineDiv, previewArea, resetButton;
let lyrics = [];
let currentLineIndex = 0;
let wavesurfer;
let isSeeking = false;
let isWavesurferReady = false;

// Initialize the application
function init() {
    audioElement = document.getElementById('audio-element');
    lyricsTextarea = document.getElementById('lyrics-textarea');
    tagButton = document.getElementById('tag-button');
    exportButton = document.getElementById('export-button');
    currentLineDiv = document.getElementById('current-line');
    previewArea = document.getElementById('preview-area');
    resetButton = document.getElementById('reset-button')

    document.getElementById('audio-file').addEventListener('change', handleFileSelect);
    lyricsTextarea.addEventListener('input', handleLyricsInput);
    tagButton.addEventListener('click', tagCurrentLine);
    exportButton.addEventListener('click', exportLRC);
    resetButton.addEventListener('click', resetTagging);

    // Improve keyboard navigation
    tagButton.addEventListener('keydown', handleTagButtonKeydown);
    exportButton.addEventListener('keydown', handleExportButtonKeydown);

    // Add error handling for file loading
    audioElement.addEventListener('error', handleAudioError);

    initWavesurfer();
    loadSavedData();
    initI18n();
}

function initWavesurfer() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        responsive: true,
        interact: true,
        backend: 'MediaElement',
    });

    
    wavesurfer.on('ready', function () {
        isWavesurferReady = true;
        syncPlayback();
    });

    wavesurfer.on('seek', function(progress) {
        if (!isSeeking) {
            isSeeking = true;
            audioElement.currentTime = progress * audioElement.duration;
            isSeeking = false;
        }
    });
}

function syncPlayback() {
    audioElement.addEventListener('play', () => {
        if (isWavesurferReady && !wavesurfer.isPlaying()) {
            wavesurfer.play();
        }
    });

    audioElement.addEventListener('pause', () => {
        if (isWavesurferReady && wavesurfer.isPlaying()) {
            wavesurfer.pause();
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (isWavesurferReady && !isSeeking) {
            wavesurfer.seekTo(audioElement.currentTime / audioElement.duration);
        }
    });

    audioElement.addEventListener('seeking', () => {
        if (isWavesurferReady) {
            isSeeking = true;
            wavesurfer.seekTo(audioElement.currentTime / audioElement.duration);
            isSeeking = false;
        }
    });
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

function handleAudioError() {
    alert('Error loading audio file. Please try again with a different file.');
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audioElement.src = objectURL;
        audioElement.load();
        isWavesurferReady = false;
        wavesurfer.load(objectURL);
    }
}

function handleLyricsInput() {
    const newLyrics = lyricsTextarea.value.split('\n').filter(line => line.trim() !== '');
    
    // If the number of lines has decreased, adjust currentLineIndex
    if (newLyrics.length < lyrics.length && currentLineIndex >= newLyrics.length) {
        currentLineIndex = Math.max(0, newLyrics.length - 1);
    }
    
    lyrics = newLyrics;
    updateCurrentLine();
    saveLyrics();
}

function resetTagging() {
    currentLineIndex = 0;
    updateCurrentLine();
}

// Tag the current line with timestamp
function tagCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        const currentTime = audioElement.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const milliseconds = Math.floor((currentTime % 1) * 100);
        const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
        
        // Check if the line already has a timestamp
        if (!/^\[\d{2}:\d{2}\.\d{2}\]/.test(lyrics[currentLineIndex])) {
            lyrics[currentLineIndex] = `${timestamp}${lyrics[currentLineIndex]}`;
        } else {
            // If it does, replace the existing timestamp
            lyrics[currentLineIndex] = lyrics[currentLineIndex].replace(/^\[\d{2}:\d{2}\.\d{2}\]/, timestamp);
        }
        
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
        currentLineDiv.textContent = i18next.t('allLinesTagged');
        tagButton.disabled = true;
    }
    exportButton.disabled = currentLineIndex < lyrics.length;
    tagButton.setAttribute('aria-label', tagButton.disabled ? 'All lines tagged' : `Tag line: ${currentLineDiv.textContent}`);
    exportButton.setAttribute('aria-label', exportButton.disabled ? 'Export not available yet' : 'Export LRC file');
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

// Initialize i18next
function initI18n() {
  i18next
    .init({
      lng: 'en', // default language
      resources: {
        en: {
          translation: {} // We'll load this dynamically
        },
        'zh-TW': {
          translation: {} // We'll load this dynamically
        }
      }
    })
    .then(function(t) {
      updateContent();
      document.getElementById('language-select').addEventListener('change', changeLanguage);
    });
  
  // Load language files
  loadLanguageFile('en');
  loadLanguageFile('zh-TW');
}

// Load language file
function loadLanguageFile(lang) {
  fetch(`i18n/${lang}.json`)
    .then(response => response.json())
    .then(data => {
      i18next.addResourceBundle(lang, 'translation', data, true, true);
      if (lang === i18next.language) {
        updateContent();
      }
    });
}

// Change language
function changeLanguage(event) {
  i18next.changeLanguage(event.target.value).then(updateContent);
}

// Update content with new language
function updateContent() {
  document.title = i18next.t('title');
  document.querySelector('h1').textContent = i18next.t('title');
  document.querySelector('#file-selection h2').textContent = i18next.t('selectAudio');
  document.querySelector('#audio-player h2').textContent = i18next.t('audioPlayer');
  document.querySelector('#lyrics-input h2').textContent = i18next.t('enterLyrics');
  document.querySelector('#lrc-tagging h2').textContent = i18next.t('lrcTagging');
  tagButton.textContent = i18next.t('thisIsIt');
  document.querySelector('#export h2').textContent = i18next.t('export');
  exportButton.textContent = i18next.t('giveItToMe');
  document.querySelector('footer p').textContent = i18next.t('footer');
    
  // Update ARIA labels
  document.getElementById('audio-file').setAttribute('aria-label', i18next.t('selectAudio'));
  audioElement.setAttribute('aria-label', i18next.t('audioPlayer'));
  lyricsTextarea.setAttribute('aria-label', i18next.t('enterLyrics'));
  tagButton.setAttribute('aria-label', i18next.t('thisIsIt'));
  exportButton.setAttribute('aria-label', i18next.t('giveItToMe'));
    
  updateCurrentLine(); // This will translate "All lines tagged" if necessary
}

// Update the current line display (modified to use i18n)
function updateCurrentLine() {
  if (currentLineIndex < lyrics.length) {
    currentLineDiv.textContent = lyrics[currentLineIndex];
    tagButton.disabled = false;
  } else {
    currentLineDiv.textContent = i18next.t('allLinesTagged');
    tagButton.disabled = true;
  }
  exportButton.disabled = currentLineIndex < lyrics.length;
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
