// Global variables
let lyricsTextarea, tagButton, exportButton, previewArea, resetButton, playPauseButton, copyButton;
let lyrics = [];
let currentLineIndex = 0;
let wavesurfer;
let audioFileName = '';
let playState = 0; // 0: stop || 1: loading || 2: pause || 3: play
const TAG_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2})\]/;

// Initialize the application
function init() {
  lyricsTextarea = document.getElementById('lyrics-textarea');
  tagButton = document.getElementById('tag-button');
  exportButton = document.getElementById('export-button');
  previewArea = document.getElementById('preview-area');
  backButton = document.getElementById('back-button');
  resetButton = document.getElementById('reset-button');
  playPauseButton = document.getElementById('playPause');
  copyButton = document.getElementById('copy-button');
  uploadFileSection = document.getElementById('file-section');
  lyricsSection = document.getElementById('lyrics-section');

  lyricsTextarea.addEventListener('paste', handlePastekLyrics);
  lyricsTextarea.addEventListener('input', handleLyricsInput);
  lyricsTextarea.addEventListener('click', handleClickLyrics);

  tagButton.addEventListener('click', tagCurrentLine);
  exportButton.addEventListener('click', exportLRC);
  backButton.addEventListener('click', backTagging);
  resetButton.addEventListener('click', resetTagging);
  playPauseButton.addEventListener('click', togglePlayPause);
  copyButton.addEventListener('click', copyLyrics);

  uploadFileSection.addEventListener('click', uploadFile);
  document.getElementById('audio-file').addEventListener('change', handleFileSelect);

  tagButton.addEventListener('keydown', handleTagButtonKeydown);
  document.addEventListener('keydown', handleKeyPress);

  initWavesurfer();
}

function initWavesurfer() {
  wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#e4e4e4',
    progressColor: '#f9595f',
    barWidth: 3,
    barRadius: 4,
    responsive: true,
    interact: true,
    plugins: [
      WaveSurfer.cursor.create({
        showTime: true,
        opacity: 1,
        customShowTimeStyle: {
          backgroundColor: '#444',
          color: '#fff',
          padding: '2px',
          fontSize: '10px',
        }
      })
    ]
  });

  wavesurfer.on('ready', function () {
    setPlayState(2);
    playPauseButton.disabled = false;
  });

  wavesurfer.on('error', function (e) {
    console.error('WaveSurfer error:', e);
    alert('Error loading audio file. Please try again with a different file.');
  });

  wavesurfer.on('loading', function (percent) {
    setPlayState(1);
  });
}

function togglePlayPause() {
  if (wavesurfer.isPlaying()) {
    wavesurfer.pause();
    setPlayState(2);
  } else {
    setTextareaScrollTop();
    wavesurfer.play();
    setPlayState(3);
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

function handleLyricsInput() {
  const newLyrics = lyricsTextarea.value.split('\n').filter(line => line.trim() !== '');

  lyrics = newLyrics.map(line => line.trim());

  // Find the first untagged line
  currentLineIndex = lyrics.findIndex(line => !line.match(TAG_REGEX));
  if (currentLineIndex === -1) {
    currentLineIndex = lyrics.length; // All lines are tagged
  }

  updateCurrentLine();
}

function handlePastekLyrics() {
  if (!localStorage.getItem('show-sv-lrc-creator-tooltip')) {
    document.querySelector('.tooltip').classList.add('show');
    localStorage.setItem('show-sv-lrc-creator-tooltip', true);
    document.body.addEventListener('click', () => {
      document.querySelector('.tooltip').remove();
    }, { once : true });
  }
}

function handleClickLyrics() {
  if (lyrics.length === 0) return;

  const cursorPosition = lyricsTextarea.selectionStart;
  const text = lyricsTextarea.value;
  const lines = text.split('\n');
  let charCount = 0;
  let clickedLineIndex = 0;

  for (const [index, line] of lines.entries()) {
    if (cursorPosition <= charCount + line.length) {
      clickedLineIndex = index;
      break;
    }
    charCount += line.length + 1; // +1 是為了跳過換行符號
  }

  setPlayerTime(clickedLineIndex);
}

function setPlayerTime(clickedLineIndex) {
  getTaggedTimeInSecondsByLineIndex(clickedLineIndex).then(({ tag, time }) => {
    wavesurfer.setCurrentTime(time);
  });
}

function getTaggedTimeInSecondsByLineIndex(lineIndex) {
  return new Promise((resolve, reject) => {
    const tag = lyrics[lineIndex].match(TAG_REGEX, '');

    if (tag) {
      const minutes = parseInt(tag[1], 10);
      const seconds = parseInt(tag[2], 10);
      const milliseconds = parseInt(tag[3], 10);
      const time = minutes * 60 + seconds - (milliseconds > 0 ? 1 : 0);

      resolve({ tag, time });
    } else {
      reject();
    }
  });
}

function backTagging() {
  if (currentLineIndex > 0) {
    getTaggedTimeInSecondsByLineIndex(currentLineIndex - 1).then(({ tag, time }) => {
      currentLineIndex -= 1;
      wavesurfer.setCurrentTime(time);
      lyrics[currentLineIndex] = lyrics[currentLineIndex].replace(tag[0], '');
      updateLyricsTextarea();
      updateCurrentLine();
      setTextareaScrollTop();
    });
  }
}

function resetTagging() {
  lyrics = lyrics.map(line => line.replace(TAG_REGEX, ''));
  currentLineIndex = 0;
  wavesurfer.setCurrentTime(0);
  updateLyricsTextarea();
  updateCurrentLine();
  setTextareaScrollTop();
}

function tagCurrentLine() {
  if (currentLineIndex < lyrics.length) {
    const currentTime = wavesurfer.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;

    lyrics[currentLineIndex] = timestamp + lyrics[currentLineIndex].replace(TAG_REGEX, '');

    // Move to the next untagged line
    currentLineIndex = lyrics.findIndex((line, index) => index > currentLineIndex && !line.match(TAG_REGEX));
    if (currentLineIndex === -1) {
      currentLineIndex = lyrics.length; // All subsequent lines are tagged
    }

    updateLyricsTextarea();
    updateCurrentLine();
    setTextareaScrollTop();
  }
}

function setTextareaScrollTop() {
  lyricsTextarea.scrollTop = currentLineIndex * 16 * 1.8;
}

function updateLyricsTextarea() {
  lyricsTextarea.value = lyrics.join('\n');
}

function updateCurrentLine() {
  if (currentLineIndex < lyrics.length) {
    const lineWithoutTag = lyrics[currentLineIndex].replace(TAG_REGEX, '');
    tagButton.disabled = false;
  } else {
    tagButton.disabled = true;
  }
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

function copyLyrics() {
  const { value } = document.getElementById('lyrics-textarea');
  const tempInput = document.createElement('textarea');

  tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
  tempInput.value = value;

  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
  document.body.removeChild(tempInput);

  // TODO: 已複製樣式
}

function uploadFile() {
  document.getElementById('audio-file').click();
}


function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFileSection.remove();
    lyricsSection.classList.remove('d-none');
    lyricsSection.classList.add('d-block');

    audioFileName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
    const objectURL = URL.createObjectURL(file);
    wavesurfer.load(objectURL);
  }
}

function setPlayState(state) {
  playState = state;

  switch (playState) {
  case 0:
  case 2:
    document.querySelector('.icon-play').classList.remove('d-none');
    document.querySelector('.icon-pause').classList.add('d-none');
    document.querySelector('.icon-loading').classList.add('d-none');
    lyricsTextarea.style.overflow = 'auto';
    break;
  case 1:
    document.querySelector('.icon-play').classList.add('d-none');
    document.querySelector('.icon-pause').classList.add('d-none');
    document.querySelector('.icon-loading').classList.remove('d-none');
    lyricsTextarea.style.overflow = 'auto';
    break;
  case 3:
    document.querySelector('.icon-play').classList.add('d-none');
    document.querySelector('.icon-pause').classList.remove('d-none');
    document.querySelector('.icon-loading').classList.add('d-none');
    lyricsTextarea.style.overflow = 'hidden';
    break;
  default:
    break;
  }
}

document.addEventListener('DOMContentLoaded', init);
