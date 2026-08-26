const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  const u = tg.initDataUnsafe?.user;
  if (u) document.getElementById('welcome').textContent = `Привет, ${u.first_name || 'пользователь'}`;
}

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');

function openModal(title, body) {
  modalContent.innerHTML = `<h2>${title}</h2>${body}`;
  modal.classList.remove('hidden');
  tg?.HapticFeedback?.impactOccurred('light');
}
function closeModal(){ modal.classList.add('hidden'); }
document.getElementById('closeModal').onclick = closeModal;
modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });

document.querySelectorAll('[data-screen]').forEach(btn => {
  btn.addEventListener('click', () => {
    const screen = btn.dataset.screen;
    if(screen === 'send') openModal('Отправить', `<div class="form"><input placeholder="Адрес получателя"/><input placeholder="Сумма"/><select><option>TON</option><option>USDT</option></select><button class="primary" onclick="demoAction()">Продолжить</button></div>`);
    if(screen === 'receive') openModal('Получить', `<p>Ваш адрес</p><div class="demo-note">UQDemoAddress7K9P</div><br><button class="primary" onclick="copyText('UQDemoAddress7K9P')">Скопировать адрес</button>`);
    if(screen === 'swap') openModal('Swap', `<div class="form"><select><option>USDT</option><option>TON</option></select><input placeholder="Сумма"/><select><option>TON</option><option>USDT</option></select><button class="primary" onclick="demoAction()">Рассчитать курс</button></div>`);
    if(screen === 'wallet') openModal('Кошелёк', `<p>Здесь будут управление сетями, адресами и резервными копиями.</p><div class="demo-note">Сейчас это демонстрационная версия. Реальные ключи и seed-фразы сюда не добавляются.</div>`);
  });
});

document.getElementById('settingsBtn').onclick = () => openModal('Настройки', `<p>Безопасность, язык, уведомления, сеть и управление кошельком.</p><p class="danger">Не вводите seed-фразу в Telegram-чат или на неизвестных сайтах.</p>`);
document.getElementById('historyBtn').onclick = () => openModal('История', `<p>История транзакций будет подключена к blockchain indexer после выбора сети.</p>`);
document.getElementById('allAssets').onclick = () => openModal('Активы', `<p>Здесь будут все токены и NFT пользователя.</p>`);

document.getElementById('copyBtn').onclick = () => copyText(document.getElementById('walletAddress').textContent);

async function copyText(text){
  try { await navigator.clipboard.writeText(text); } catch {}
  tg?.HapticFeedback?.notificationOccurred('success');
  openModal('Готово', `<p>Адрес скопирован.</p>`);
}
function demoAction(){
  tg?.HapticFeedback?.notificationOccurred('success');
  openModal('Демо', `<div class="demo-note">Это пока интерфейс-прототип. Реальная отправка и обмен подключаются после выбора блокчейна и backend.</div>`);
}
