const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById("welcome").textContent =
      `Привет, ${user.first_name || "пользователь"}`;
  }
}

const modal = document.getElementById("modal");
const content = document.getElementById("modalContent");

function openModal(title, body) {
  content.innerHTML = `<h2>${title}</h2>${body}`;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("closeModal").onclick = closeModal;
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

const manifestUrl =
  new URL("./tonconnect-manifest.json", window.location.href).toString();

const TELEGRAM_RETURN_URL = "https://t.me/TrollBanktelegrambot";

let tonConnectUI = null;

function shortAddress(address) {
  return address.length > 18
    ? address.slice(0, 8) + "…" + address.slice(-8)
    : address;
}

function setDisconnected() {
  document.getElementById("walletAddress").textContent =
    "Кошелёк не подключён";
  document.getElementById("balance").textContent = "— TON";
  document.getElementById("assetTon").textContent = "— TON";
  document.getElementById("status").textContent =
    "Кошелёк не подключён. Нажмите Connect Wallet.";
}

async function loadBalance(address) {
  try {
    const response = await fetch(
      "https://toncenter.com/api/v2/getAddressBalance?address=" +
      encodeURIComponent(address)
    );
    const data = await response.json();
    if (!data.ok) throw new Error("TON API error");

    const ton = Number(data.result) / 1e9;
    document.getElementById("balance").textContent =
      ton.toFixed(4) + " TON";
    document.getElementById("assetTon").textContent =
      ton.toFixed(4) + " TON";
    document.getElementById("status").textContent =
      "Кошелёк подключён. Баланс получен из TON blockchain.";
  } catch (error) {
    console.error("Balance error:", error);
    document.getElementById("status").textContent =
      "Кошелёк подключён, но баланс пока не удалось получить.";
  }
}

function showConnectionError(error) {
  console.error("TON Connect error:", error);
  const message =
    error?.message ||
    error?.error?.message ||
    "Неизвестная ошибка подключения";

  document.getElementById("status").textContent =
    "Ошибка TON Connect: " + message;

  openModal(
    "Не удалось подключить кошелёк",
    `<p>${message}</p>
     <p class="note">
       Если вы подключаете Wallet внутри Telegram, снова выберите
       <b>Connect Wallet in Telegram</b>.
     </p>`
  );
}

try {
  if (!window.TON_CONNECT_UI?.TonConnectUI) {
    throw new Error("TON Connect UI не загрузился");
  }

  tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl,
    buttonRootId: "connectButton",
    actionsConfiguration: {
      twaReturnUrl: TELEGRAM_RETURN_URL,
      returnStrategy: "back",
      modals: "all",
      notifications: "all"
    },
    uiPreferences: {
      theme: "DARK"
    }
  });

  tonConnectUI.onStatusChange(async wallet => {
    if (!wallet) {
      setDisconnected();
      return;
    }

    const address = wallet.account.address;
    document.getElementById("walletAddress").textContent =
      shortAddress(address);
    document.getElementById("status").textContent =
      "Кошелёк подключён. Получаем баланс…";

    await loadBalance(address);
  });

  tonConnectUI.connectionRestored
    .then(restored => console.log("Connection restored:", restored))
    .catch(error => console.error("Restore error:", error));

} catch (error) {
  showConnectionError(error);
}

document.getElementById("copyBtn").onclick = async () => {
  const address = document.getElementById("walletAddress").textContent;
  if (address === "Кошелёк не подключён") {
    openModal("Нет кошелька", "<p>Сначала подключите TON-кошелёк.</p>");
    return;
  }
  try {
    await navigator.clipboard.writeText(address);
    openModal("Готово", "<p>Адрес скопирован.</p>");
  } catch {
    openModal("Адрес", `<p>${address}</p>`);
  }
};

document.getElementById("receiveBtn").onclick = () => {
  const address = document.getElementById("walletAddress").textContent;
  if (address === "Кошелёк не подключён") {
    openModal("Получить", "<p>Сначала подключите TON-кошелёк.</p>");
    return;
  }
  openModal("Получить TON", `<p>Ваш адрес:</p><div class="note">${address}</div>`);
};

document.getElementById("sendBtn").onclick = () => {
  openModal(
    "Отправить",
    `<div class="form">
      <input id="sendAddress" placeholder="Адрес получателя">
      <input id="sendAmount" placeholder="Сумма TON" inputmode="decimal">
      <button class="primary" id="continueSend">Продолжить</button>
    </div>`
  );

  document.getElementById("continueSend").onclick = () => {
    if (!tonConnectUI?.connected) {
      openModal("Нет кошелька", "<p>Сначала подключите кошелёк.</p>");
      return;
    }
    const address = document.getElementById("sendAddress").value.trim();
    const amount = Number(
      document.getElementById("sendAmount").value.replace(",", ".")
    );
    if (!address || !Number.isFinite(amount) || amount <= 0) {
      openModal("Проверьте данные",
        "<p>Введите корректный адрес и сумму TON.</p>");
      return;
    }
    openModal(
      "Следующий этап",
      `<p>TON Connect подключён. Реальную отправку включим отдельным шагом.</p>
       <p class="danger">Перед отправкой всегда проверяйте адрес и сумму в окне кошелька.</p>`
    );
  };
};

document.getElementById("swapBtn").onclick = () =>
  openModal("Swap", "<p>Swap подключим после стабильного подключения кошелька.</p>");

document.getElementById("swapNav").onclick = () =>
  document.getElementById("swapBtn").click();

document.getElementById("walletBtn").onclick = () =>
  openModal("Кошелёк",
    "<p>Следующим этапом здесь появятся токены, история и управление активами.</p>");

document.getElementById("settingsBtn").onclick = () =>
  openModal("Настройки",
    `<p>Настройки добавим следующим этапом.</p>
     <p class="danger">Никогда не вводите seed-фразу или приватный ключ в Troll.Wallet.</p>`);
