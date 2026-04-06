const STORAGE_KEY = "somali-pilot-conversations";
const MODEL_KEY = "somali-pilot-model";
const ACTIVE_CHAT_KEY = "somali-pilot-active-chat";
// For production, replace localhost with deployed backend URL.
const CHAT_API_URL = "http://localhost:3000/chat";
const SYSTEM_PROMPT =
  "You are a Somali cultural assistant. Provide accurate, respectful, and concise answers about Somali culture, language, history, traditions, poetry, and identity.";

const appState = {
  conversations: [],
  activeChatId: null,
  isGenerating: false,
  backgroundIndex: 0,
};

const elements = {
  historyList: document.getElementById("historyList"),
  messages: document.getElementById("messages"),
  chatForm: document.getElementById("chatForm"),
  messageInput: document.getElementById("messageInput"),
  newChatBtn: document.getElementById("newChatBtn"),
  modelSelect: document.getElementById("modelSelect"),
  activeModelLabel: document.getElementById("activeModelLabel"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebar: document.getElementById("sidebar"),
  messageTemplate: document.getElementById("messageTemplate"),
  bgLayers: Array.from(document.querySelectorAll(".bg-layer")),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.conversations));
  localStorage.setItem(ACTIVE_CHAT_KEY, appState.activeChatId || "");
  localStorage.setItem(MODEL_KEY, elements.modelSelect.value);
}

function loadState() {
  try {
    const savedConversations = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(savedConversations)) {
      appState.conversations = savedConversations;
    }
  } catch (error) {
    console.warn("Could not parse saved conversations.", error);
  }

  const savedModel = localStorage.getItem(MODEL_KEY);
  if (savedModel) {
    elements.modelSelect.value = savedModel;
    elements.activeModelLabel.textContent = savedModel;
  }

  const savedActiveChat = localStorage.getItem(ACTIVE_CHAT_KEY);
  if (savedActiveChat && appState.conversations.some((chat) => chat.id === savedActiveChat)) {
    appState.activeChatId = savedActiveChat;
  }

  if (!appState.activeChatId) {
    createConversation({
      title: "Welcome Chat",
      seedMessages: [
        {
          id: uid(),
          role: "assistant",
          content:
            "Welcome to the Garissa University Somali Culture Model. Ask about Somali heritage, traditions, poetry, language, or historical context to begin.",
          timestamp: nowLabel(),
        },
      ],
    });
  }
}

function createConversation(options = {}) {
  const conversation = {
    id: uid(),
    title: options.title || "New Conversation",
    createdAt: Date.now(),
    messages: options.seedMessages || [],
  };

  appState.conversations.unshift(conversation);
  appState.activeChatId = conversation.id;
  saveState();
  renderHistory();
  renderMessages();
  return conversation;
}

function getActiveConversation() {
  return appState.conversations.find((chat) => chat.id === appState.activeChatId) || null;
}

function setActiveConversation(chatId) {
  appState.activeChatId = chatId;
  saveState();
  renderHistory();
  renderMessages();
  closeSidebarOnMobile();
}

function updateConversationTitle(conversation) {
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");
  if (!firstUserMessage) {
    conversation.title = "New Conversation";
    return;
  }

  conversation.title = firstUserMessage.content.trim().slice(0, 40) || "New Conversation";
}

function renderHistory() {
  elements.historyList.innerHTML = "";

  appState.conversations.forEach((chat) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-item${chat.id === appState.activeChatId ? " active" : ""}`;
    button.dataset.id = chat.id;

    const lastMessage = chat.messages[chat.messages.length - 1];
    const preview = lastMessage ? lastMessage.content : "Start a new chat";

    button.innerHTML = `
      <span class="history-title">${escapeHtml(chat.title)}</span>
      <span class="history-preview">${escapeHtml(preview)}</span>
    `;

    button.addEventListener("click", () => setActiveConversation(chat.id));
    elements.historyList.appendChild(button);
  });
}

function renderMessages() {
  const activeConversation = getActiveConversation();
  elements.messages.innerHTML = "";

  if (!activeConversation || activeConversation.messages.length === 0) {
    renderEmptyState();
    return;
  }

  activeConversation.messages.forEach((message) => {
    const node = buildMessageNode(message);
    elements.messages.appendChild(node);
  });

  scrollToBottom();
}

function renderEmptyState() {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";
  wrapper.innerHTML = `
    <h2>Somali Culture Assistant</h2>
    <p>
      Explore Somali identity, literature, customs, and oral traditions through a focused AI chat interface
      designed for Garissa University.
    </p>
  `;
  elements.messages.appendChild(wrapper);
}

function buildMessageNode(message) {
  const fragment = elements.messageTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".message");
  const meta = fragment.querySelector(".message-meta");
  const bubble = fragment.querySelector(".bubble");

  article.classList.add(message.role);
  meta.textContent = `${message.role === "user" ? "You" : "AI Assistant"} - ${message.timestamp || nowLabel()}`;

  if (message.loading) {
    bubble.classList.add("typing-bubble");
    bubble.innerHTML = `
      <span class="loading-dots" aria-label="Assistant is typing">
        <span></span><span></span><span></span>
      </span>
    `;
  } else {
    bubble.textContent = message.content;
  }

  return fragment;
}

function addMessage(role, content, options = {}) {
  const conversation = getActiveConversation();
  if (!conversation) {
    return null;
  }

  const message = {
    id: uid(),
    role,
    content,
    timestamp: options.timestamp || nowLabel(),
    loading: Boolean(options.loading),
  };

  conversation.messages.push(message);
  updateConversationTitle(conversation);
  saveState();
  renderHistory();
  renderMessages();
  return message;
}

function replaceMessage(messageId, newData) {
  const conversation = getActiveConversation();
  if (!conversation) {
    return;
  }

  const target = conversation.messages.find((message) => message.id === messageId);
  if (!target) {
    return;
  }

  Object.assign(target, newData);
  saveState();
  renderHistory();
  renderMessages();
}

function autoResizeTextarea() {
  elements.messageInput.style.height = "auto";
  elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 180)}px`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildApiMessages(conversation) {
  const history = conversation.messages
    .filter((message) => !message.loading && (message.role === "user" || message.role === "assistant"))
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];
}

async function requestGroqCompletion(conversation) {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: buildApiMessages(conversation),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Backend request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const content = data?.content?.trim();
  if (!content) {
    throw new Error("Backend returned an empty response.");
  }

  return content;
}

function typeAssistantResponse(messageId, fullText) {
  let index = 0;

  const step = () => {
    index += 1;
    replaceMessage(messageId, {
      loading: false,
      content: fullText.slice(0, index),
      timestamp: nowLabel(),
    });

    if (index < fullText.length) {
      scrollToBottom();
      window.setTimeout(step, 14);
      return;
    }

    appState.isGenerating = false;
    saveState();
  };

  step();
}

async function sendMessage(userMessage) {
  if (appState.isGenerating) {
    return;
  }

  const content = userMessage.trim();
  if (!content) {
    return;
  }

  if (!getActiveConversation()) {
    createConversation();
  }

  addMessage("user", content);
  elements.messageInput.value = "";
  autoResizeTextarea();
  scrollToBottom();

  appState.isGenerating = true;
  const loadingMessage = addMessage("assistant", "", { loading: true });
  const conversation = getActiveConversation();

  try {
    const replyText = await requestGroqCompletion(conversation);
    if (loadingMessage) {
      typeAssistantResponse(loadingMessage.id, replyText);
    }
  } catch (error) {
    console.error("Groq API error:", error);
    appState.isGenerating = false;

    if (loadingMessage) {
      replaceMessage(loadingMessage.id, {
        loading: false,
        content: `Error: ${error.message || "Unable to get a response right now."}`,
        timestamp: nowLabel(),
      });
    }
  }
}

function handleSendMessage(event) {
  event.preventDefault();
  sendMessage(elements.messageInput.value);
}

function rotateBackground() {
  window.setInterval(() => {
    appState.backgroundIndex = (appState.backgroundIndex + 1) % elements.bgLayers.length;
    elements.bgLayers.forEach((layer, index) => {
      layer.classList.toggle("active", index === appState.backgroundIndex);
    });
  }, 10000);
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 1024) {
    document.body.classList.remove("sidebar-open");
  }
}

function bindEvents() {
  elements.chatForm.addEventListener("submit", handleSendMessage);

  elements.messageInput.addEventListener("input", autoResizeTextarea);
  elements.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSendMessage(event);
    }
  });

  elements.newChatBtn.addEventListener("click", () => {
    createConversation();
    closeSidebarOnMobile();
  });

  elements.modelSelect.addEventListener("change", () => {
    elements.activeModelLabel.textContent = elements.modelSelect.value;
    saveState();
  });

  elements.sidebarToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 1024 || !document.body.classList.contains("sidebar-open")) {
      return;
    }

    const clickInsideSidebar = elements.sidebar.contains(event.target);
    const clickOnToggle = elements.sidebarToggle.contains(event.target);
    if (!clickInsideSidebar && !clickOnToggle) {
      document.body.classList.remove("sidebar-open");
    }
  });

  window.addEventListener("resize", closeSidebarOnMobile);
}

function init() {
  loadState();
  renderHistory();
  renderMessages();
  autoResizeTextarea();
  bindEvents();
  rotateBackground();
}

init();
