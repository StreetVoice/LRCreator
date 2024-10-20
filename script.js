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
        responsive: true
    });

    wavesurfer.on('ready', function () {
        audioElement.addEventListener('play', () => wavesurfer.play());
        audioElement.addEventListener('pause', () => wavesurfer.pause());
        audioElement.addEventListener('seeked', () => wavesurfer.seekTo(audioElement.currentTime / audioElement.duration));
        wavesurfer.on('seek', (progress) => {
            audioElement.currentTime = progress * audioElement.duration;
        });
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
        wavesurfer.load(objectURL);
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
        tagButton.setAttribute('aria-label', `Tag line: ${lyrics[currentLineIndex]}`);
    } else {
        currentLineDiv.textContent = i18next.t('allLinesTagged');
        tagButton.disabled = true;
        tagButton.setAttribute('aria-label', 'All lines tagged');
    }
    exportButton.disabled = currentLineIndex < lyrics.length;
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
