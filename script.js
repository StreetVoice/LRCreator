// Global variables
let lyricsTextarea, tagButton, exportButton, currentLineDiv, previewArea, resetButton;
let lyrics = [];
let currentLineIndex = 0;
let wavesurfer;

// Initialize the application
function init() {
    lyricsTextarea = document.getElementById('lyrics-textarea');
    tagButton = document.getElementById('tag-button');
    exportButton = document.getElementById('export-button');
    currentLineDiv = document.getElementById('current-line');
    previewArea = document.getElementById('preview-area');
    resetButton = document.getElementById('reset-button');

    document.getElementById('audio-file').addEventListener('change', handleFileSelect);
    lyricsTextarea.addEventListener('input', handleLyricsInput);
    tagButton.addEventListener('click', tagCurrentLine);
    exportButton.addEventListener('click', exportLRC);
    resetButton.addEventListener('click', resetTagging);

    tagButton.addEventListener('keydown', handleTagButtonKeydown);
    exportButton.addEventListener('keydown', handleExportButtonKeydown);

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
        document.getElementById('playPause').addEventListener('click', function() {
            wavesurfer.playPause();
        });

        document.getElementById('volume').addEventListener('input', function() {
            wavesurfer.setVolume(this.value);
        });
    });

    wavesurfer.on('error', function(e) {
        console.error('WaveSurfer error:', e);
        alert('Error loading audio file. Please try again with a different file.');
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

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        wavesurfer.load(objectURL);
    }
}

function handleLyricsInput() {
    const newLyrics = lyricsTextarea.value.split('\n').filter(line => line.trim() !== '');
    
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

function tagCurrentLine() {
    if (currentLineIndex < lyrics.length) {
        const currentTime = wavesurfer.getCurrentTime();
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const milliseconds = Math.floor((currentTime % 1) * 100);
        const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
        
        if (!/^\[\d{2}:\d{2}\.\d{2}\]/.test(lyrics[currentLineIndex])) {
            lyrics[currentLineIndex] = `${timestamp}${lyrics[currentLineIndex]}`;
        } else {
            lyrics[currentLineIndex] = lyrics[currentLineIndex].replace(/^\[\d{2}:\d{2}\.\d{2}\]/, timestamp);
        }
        
        currentLineIndex++;
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

function initI18n() {
    i18next
        .init({
            lng: 'en',
            resources: {
                en: { translation: {} },
                'zh-TW': { translation: {} }
            }
        })
        .then(function(t) {
            updateContent();
            document.getElementById('language-select').addEventListener('change', changeLanguage);
        });
    
    loadLanguageFile('en');
    loadLanguageFile('zh-TW');
}

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

function changeLanguage(event) {
    i18next.changeLanguage(event.target.value).then(updateContent);
}

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
    
    document.getElementById('audio-file').setAttribute('aria-label', i18next.t('selectAudio'));
    document.getElementById('playPause').setAttribute('aria-label', i18next.t('playPause'));
    document.getElementById('volume').setAttribute('aria-label', i18next.t('volume'));
    lyricsTextarea.setAttribute('aria-label', i18next.t('enterLyrics'));
    tagButton.setAttribute('aria-label', i18next.t('thisIsIt'));
    exportButton.setAttribute('aria-label', i18next.t('giveItToMe'));
    
    updateCurrentLine();
}

document.addEventListener('DOMContentLoaded', init);
