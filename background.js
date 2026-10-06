chrome.action.onClicked.addListener((tab) => {
  // Só actua em páginas de vídeo do YouTube
  if (tab.url && tab.url.includes('youtube.com/watch')) {
    chrome.tabs.sendMessage(tab.id, { action: 'openLocalVideo' });
  } else {
    // Fora do YouTube — abre uma notificação simples
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert('YT Local Player: navega para um vídeo do YouTube primeiro (youtube.com/watch?v=...)');
      }
    });
  }
});
