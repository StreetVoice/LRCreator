const meta = {
  'en': {
    'title': 'LRC Lyrics Generator | Free Online Tool',
    'site_name': 'LRC Lyrics Generator',
    'description': 'Ease of use LRC lyrics generator. Create synchronized lyrics effortlessly with this free online tool.',
    'keywords': 'lrc, generator, creator, lyrics synchronization, free online tool for LRC, best LRC generator, lyrics synchronizer, lyrics sync',
    'og:title': 'LRC Lyrics Generator | Free Online Tool - powered by StreetVoice',
    'lang': 'en',
  },
  'zh-tw': {
    'title': 'LRC 動態歌詞產生器 | 免費線上工具',
    'site_name': 'LRC 動態歌詞產生器',
    'description': '世界上最好用的動態歌詞產生器，輕鬆產生同步歌詞。',
    'keywords': 'lrc, generator, creator, 動態歌詞產生器, 歌詞同步, 免費, 工具, 最好用的 LRC 產生器, lyrics synchronizer, lyrics sync',
    'og:title': 'LRC 動態歌詞產生器 | 免費線上工具  - powered by StreetVoice',
    'lang': 'zh-TW',
  }
};

let metaObj = {};

function setLanguage() {
  const language = localStorage.getItem('language') || (/zh-tw/.test(navigator.language.toLowerCase()) ? 'zh-tw' : 'en');
  localStorage.setItem('language', language);
}

setLanguage();

document.addEventListener('DOMContentLoaded', () => {
  metaObj = meta[localStorage.getItem('language')];
  document.documentElement.lang = metaObj['lang'];
  document.title = metaObj['title'];
  document.querySelector('meta[name="description"]').setAttribute('content', metaObj['description']);
  document.querySelector('meta[name="keywords"]').setAttribute('content', metaObj['keywords']);
  document.querySelector('meta[property="og:title"]').setAttribute('content', metaObj['og:title']);
  document.querySelector('meta[property="og:site_name"]').setAttribute('content', metaObj['site_name']);
  document.querySelector('meta[property="og:description"]').setAttribute('content', metaObj['description']);
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', metaObj['og:title']);
  document.querySelector('meta[name="twitter:description"]').setAttribute('content', metaObj['description']);
});
