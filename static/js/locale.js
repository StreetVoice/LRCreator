const locale = {
  'en': {
    1: 'LRC Genetator',
    2: 'Upload audio file here',
    3: 'Don’t worry! We will not access your audio files, and your song will not be uploaded anywhere or used for any other purposes.',
    4: 'Input lyrics',
    5: 'Song info',
    6: 'Previous line',
    7: 'Reset',
    8: 'Copy',
    9: 'Export',
    10: '\u00A9 StreetVoice.',
    11: 'Interface guide',
    12: 'Playback speed',
    13: 'Rewind 5 seconds',
    14: 'Fast forward 5 seconds',
    15: 'Label with timestamp',
    16: 'Clear previous line’s timestamp',
    17: 'Clear all timestamps',
    18: 'Copy all text',
    19: 'Export file',
    20: 'Hotkeys',
    21: 'Label with timestamp',
    22: 'Play / Pause',
    23: 'Click the play button, then click the clock button at the desired moment to add timestamp label!',
    24: 'Normal',
    25: 'Close',
    26: "You haven't copied or exported yet. Are you sure you want to leave?",
    27: 'Cancel',
    28: 'Leave',
    29: 'Title',
    30: 'Artist',
    31: 'Album',
    32: 'Author',
    33: 'Confirm',
    34: 'The upload format is limited to .mp3',
    35: 'Please check your file format and try again',
    36: 'The Best LRC Generator in the World'
  },
  'zh-tw': {
    1: 'LRC 動態歌詞產生器',
    2: '上傳歌曲',
    3: '請放心！我們不會取得你的音檔，你的歌曲也不會經此上傳到任何地方或作為其他用途。',
    4: '請輸入歌詞',
    5: '歌曲資訊',
    6: '上一句',
    7: '重來',
    8: '複製',
    9: '匯出',
    10: '\u00A9 StreetVoice 街聲.',
    11: '按鈕說明',
    12: '播放速度',
    13: '快退 5 秒',
    14: '快進 5 秒',
    15: '標記時間',
    16: '清除上一句的時間標記',
    17: '清除所有時間標記',
    18: '複製所有文字',
    19: '匯出檔案',
    20: '電腦快捷鍵',
    21: '標記這一行',
    22: '播放 / 暫停',
    23: '點擊播放按鈕後，再在要標記的時間點擊標記按鈕就可以囉！',
    24: '正常',
    25: '關閉',
    26: '你還沒有複製或是匯出，確定要離開嗎？',
    27: '取消',
    28: '離開',
    29: '歌名',
    30: '演唱者',
    31: '所屬專輯',
    32: '作詞作曲',
    33: '確定',
    34: '上傳格式限 .mp3',
    35: '檔案有問題，請檢查後再重試',
    36: '世界上最好用的動態歌詞產生器',
  }
};

let localeObj = {};

function getLocale() {
  let language = localStorage.getItem('language') || /zh-tw/.test(navigator.language.toLowerCase()) ? 'zh-tw' : 'en';
  localeObj = locale[language];
  localStorage.setItem('language', language);
};

function i18n() {
  document.querySelectorAll('.i18n').forEach((element) => {
    element.textContent = localeObj[element.dataset.i18nId];
  });

  document.querySelectorAll('.i18n-aria-label').forEach((element) => {
    element.ariaLabel = localeObj[element.dataset.i18nId];
  });

  document.querySelectorAll('.i18n-placeholder').forEach((element) => {
    element.placeholder = localeObj[element.dataset.i18nId];
  });
}

getLocale();
i18n();
