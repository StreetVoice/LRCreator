// Global variables
let lyricsTextarea, tagButton, exportButton, prevLineButton, resetButton, playPauseButton, copyButton, currentLineDiv, backwardBtn, forwardBtn;
let lyrics = [];
let currentLineIndex = 0;
let wavesurfer;
let audioFileName = '';
let playState = 0; // 0: stop || 1: loading || 2: pause || 3: play
let changed = false;
const TAG_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2})\]/;
const language = (/zh-tw/.test(navigator.language.toLowerCase()) ? 'zh-tw' : 'en');

// Initialize the application
function init() {
  lyricsTextarea = document.getElementById('lyrics-textarea');
  tagButton = document.getElementById('tag-button');
  exportButton = document.getElementById('export-button');
  prevLineButton = document.getElementById('back-button');
  resetButton = document.getElementById('reset-button');
  playPauseButton = document.getElementById('playPause');
  copyButton = document.getElementById('copy-button');
  uploadFileSection = document.getElementById('file-section');
  lyricsSection = document.getElementById('lyrics-section');
  currentLineDiv = document.getElementById('current-line');
  backwardBtn = document.querySelector('.btn-link .icon-backward');
  forwardBtn = document.querySelector('.btn-link .icon-forward');

  lyricsTextarea.addEventListener('paste', handlePastekLyrics);
  lyricsTextarea.addEventListener('input', handleLyricsInput);
  lyricsTextarea.addEventListener('click', handleClickLyrics);

  tagButton.addEventListener('click', tagCurrentLine);
  exportButton.addEventListener('click', exportLRC);
  prevLineButton.addEventListener('click', backTagging);
  resetButton.addEventListener('click', resetTagging);
  playPauseButton.addEventListener('click', togglePlayPause);
  copyButton.addEventListener('click', copyLyrics);

  uploadFileSection.addEventListener('click', uploadFile);
  uploadFileSection.addEventListener('drop', handleDrop);
  uploadFileSection.addEventListener('dragover', handleDragOver);
  document.getElementById('audio-file').addEventListener('change', handleFileSelect);

  backwardBtn.addEventListener('click', handleBackward);
  forwardBtn.addEventListener('click', handleForward);

  document.addEventListener('keydown', handleKeydown);

  window.addEventListener("resize", setTextareaScrollTop);
  window.addEventListener('beforeunload', handleBeforeunload);

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
    setPlayState(0);
    playPauseButton.disabled = false;
  });

  wavesurfer.on('error', function (e) {
    showAlert(localeObj[35]);
  });

  wavesurfer.on('loading', function (percent) {
    setPlayState(1);
  });

  wavesurfer.on('finish', function () {
    wavesurfer.setCurrentTime(0);
    setPlayState(0);
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

function handleLyricsInput() {
  const newLyrics = lyricsTextarea.value.split('\n');

  lyrics = newLyrics.map(line => line.trim());
  currentLineDiv.textContent = lyrics[0];

  // Find the first untagged line
  currentLineIndex = lyrics.findIndex(line => !line.match(TAG_REGEX));
  if (currentLineIndex === -1) {
    currentLineIndex = lyrics.length; // All lines are tagged
  }

  updateCurrentLine();
  copyButton.textContent = language === 'en' ? 'Copy' : '複製';
  changed = true;

  if (lyricsTextarea.value.trim().length > 0) {
    lyricsTextarea.classList.add('push-lyrics');
  } else {
    lyricsTextarea.classList.remove('push-lyrics');
  }
}

function handlePastekLyrics() {
  if (!localStorage.getItem('show-sv-lrc-creator-tooltip')) {
    document.querySelector('.tooltip').classList.add('show');
    localStorage.setItem('show-sv-lrc-creator-tooltip', true);
    changed = true;
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
      currentLineDiv.textContent = lyrics[currentLineIndex];
      updateLyricsTextarea();
      updateCurrentLine();
      setTextareaScrollTop();
    });
  }
}

function resetTagging() {
  lyrics = lyrics.map(line => line.replace(TAG_REGEX, ''));
  currentLineIndex = 0;
  currentLineDiv.textContent = lyrics[currentLineIndex];
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
    currentLineDiv.textContent = lyrics[currentLineIndex];

    updateLyricsTextarea();
    updateCurrentLine();
    setTextareaScrollTop();
  }
}

function setTextareaScrollTop() {
  const div = document.createElement('div');
  const { fontFamily, fontSize, fontWeight, lineHeight, paddingLeft, paddingRight } = window.getComputedStyle(lyricsTextarea);

  div.style.visibility = 'hidden';
  div.style.position = 'absolute';
  div.style.display = 'block';
  div.style.fontFamily = fontFamily;
  div.style.fontSize = fontSize;
  div.style.fontWeight = fontWeight;
  div.style.lineHeight = lineHeight;
  div.style.paddingLeft = paddingLeft;
  div.style.paddingRight = paddingRight;
  div.style.overflowY = 'scroll';
  div.style.width = `${lyricsTextarea.clientWidth}px`;

  for (let i = 0; i < currentLineIndex; i++) {
    div.appendChild(document.createTextNode(lyrics[i] || ''));
    div.appendChild(document.createElement('br')); // 模擬換行
  }

  document.body.appendChild(div);
  lyricsTextarea.scrollTop = div.offsetHeight;
  document.body.removeChild(div);
}

function updateLyricsTextarea() {
  copyButton.textContent = language === 'en' ? 'Copy' : '複製';
  lyricsTextarea.value = lyrics.join('\n');
}

function updateCurrentLine() {
  if (currentLineIndex < lyrics.length) {
    tagButton.disabled = false;
  } else {
    tagButton.disabled = true;
  }
}


function generateSongInfo() {
  const values = Object.entries(Object.fromEntries(new FormData(document.getElementById('song-info-form')))).filter(([key, value]) => value.trim() !== '');

  return values.map(([key, value]) => `[${key}:${value}]`);
}


function exportLRC() {
  const songInfo = generateSongInfo();
  const lrcContent = songInfo.concat(lyrics).join('\n');
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

  changed = false;
}

function copyLyrics() {
  const { value } = lyricsTextarea;
  const tempInput = document.createElement('textarea');

  tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
  tempInput.value = value;

  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
  document.body.removeChild(tempInput);
  copyButton.textContent = language === 'en' ? 'Copied!' : '已複製';
  changed = false;
}

function uploadFile() {
  document.getElementById('audio-file').click();
}

function handleDrop(e) {
  e.preventDefault();

  const file = e.dataTransfer.items[0].getAsFile();

  if (file.type === 'audio/mpeg') {
    handleFileSelect({
      target: {
        files: [file],
      },
    });
  } else {
    showAlert(localeObj[34]);
  }
}

function handleDragOver(e) {
  e.preventDefault();
}

function showAlert(message) {
  document.querySelector('.modal-text').textContent = message;
  $('#modal-alert').modal('show');
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
  case 0: // stop
  case 2: // pause
    document.querySelector('.icon-play').classList.remove('d-none');
    document.querySelector('.icon-pause').classList.add('d-none');
    document.querySelector('.icon-loading').classList.add('d-none');
    lyricsTextarea.classList.remove('overflow-hidden');
    currentLineDiv.classList.remove('d-block');
    currentLineDiv.classList.add('d-none');
    break;
  case 1: // loading
    document.querySelector('.icon-play').classList.add('d-none');
    document.querySelector('.icon-pause').classList.add('d-none');
    document.querySelector('.icon-loading').classList.remove('d-none');
    lyricsTextarea.classList.remove('overflow-hidden');
    break;
  case 3: // playing
    document.querySelector('.icon-play').classList.add('d-none');
    document.querySelector('.icon-pause').classList.remove('d-none');
    document.querySelector('.icon-loading').classList.add('d-none');
    lyricsTextarea.classList.add('overflow-hidden');
    currentLineDiv.classList.add('d-block');
    currentLineDiv.classList.remove('d-none');
    break;
  default:
    break;
  }
}

function handleBackward() {
  let currentTime = wavesurfer.getCurrentTime() - 5;

  if (currentTime < 0) currentTime = 0;
  wavesurfer.setCurrentTime(currentTime);
}

function handleForward() {
  const duration = wavesurfer.getDuration();
  let currentTime = wavesurfer.getCurrentTime() + 5;

  if (currentTime >= duration) {
    wavesurfer.stop();
    wavesurfer.setCurrentTime(0);
    setPlayState(0);
  } else {
    wavesurfer.setCurrentTime(currentTime);
  }
}

function handleKeydown(e) {
  if (document.activeElement === lyricsTextarea) return;

  const key = e.key.toLowerCase();

  if (key === ' ') {
    e.preventDefault();
    tagButton.click();
  } else if (key === 'z') {
    prevLineButton.click();
  } else if (key === 'tab') {
    e.preventDefault();
    playPauseButton.click();
  } else if (key === 'b') {
    backwardBtn.click();
  } else if (key === 'f') {
    forwardBtn.click();
  }
}

function handleBeforeunload(e) {
  if (changed) {
    e.preventDefault();
    e.returnValue = '';
  }
}

document.addEventListener('DOMContentLoaded', init);
