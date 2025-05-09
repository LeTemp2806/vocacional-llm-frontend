<template>
  <div :class="['chat-background', { mobile: isMobile }]">
    <!-- Sidebar Panel -->
    <Transition name="slide" mode="out-in">
      <aside v-if="!isMobile || view === 'sidebar'" class="sidebar" key="sidebar">
        <button class="new-chat" @click="startNew" :disabled="creating">+ Nuevo chat</button>
        <div class="conversation-list">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            :class="['conversation-item', { active: currentId === conv.id }]"
            @click="openChat(conv.id)">
            {{ conv.last_message ? truncate(conv.last_message, 5) : `Chat ${conv.id}` }}
          </div>
        </div>
        <button class="switch" @click="logout">Cerrar sesión</button>
      </aside>
    </Transition>

    <!-- Chat Panel -->
    <Transition name="slide" mode="out-in">
      <section v-if="!isMobile || view === 'chat'" class="chat-window" key="chat">
        <header v-if="isMobile" class="chat-header">
          <button class="back-btn" @click="view = 'sidebar'">← Volver</button>
        </header>
        <div class="messages">
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            :class="['message', msg.from === 'user' ? 'user' : 'bot']">
            <strong>{{ msg.from === 'user' ? 'Tú:' : 'Bot:' }}</strong> {{ msg.text }}
          </div>
        </div>

        <div class="input-area">
          <input v-model="inputText" type="text" placeholder="Escribe un mensaje..." @keyup.enter="send" />
          <button @click="send">Enviar</button>
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();
const conversations = ref([]);
const currentId = ref(null);
const inputText = ref('');
const creating = ref(false);
const view = ref('sidebar');

// Responsive: true si ancho < 768px
const isMobile = ref(window.innerWidth < 768);
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) view.value = 'sidebar';
});

// Trunca texto a máximo de 'maxWords' palabras
function truncate(text, maxWords) {
  const words = text.split(' ');
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ') + '...';
}

// Extrae user_id desde JWT
function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).user_id;
  } catch {
    return null;
  }
}
const userId = getUserIdFromToken();

const currentMessages = computed(() => {
  const conv = conversations.value.find(c => c.id === currentId.value);
  return conv ? conv.messages : [];
});

async function fetchConversations() {
  try {
    const { data } = await api.get('/conversations/');
    conversations.value = data.map(c => ({ id: c.id, last_message: c.last_message, timestamp: c.timestamp, messages: [] }));
    if (conversations.value.length) {
      currentId.value = conversations.value[0].id;
    }
  } catch {
    alert('No se pudieron cargar conversaciones');
  }
}

function openChat(id) {
  currentId.value = id;
  view.value = 'chat';
  const conv = conversations.value.find(c => c.id === id);
  if (conv && conv.messages.length === 0) loadMessages(id, conv);
}

async function loadMessages(id, conv) {
  try {
    const { data } = await api.get(`/conversations/${id}/messages`);
    conv.messages = data.map(m => ({ id: m.id, from: m.sender, text: m.text, timestamp: m.timestamp }));
  } catch {
    alert('No se pudieron cargar los mensajes');
  }
}

async function startNew() {
  creating.value = true;
  try {
    // Crear nueva conversación sin body
    const { data } = await api.post('/conversations/');
    conversations.value.unshift({ id: data.id, last_message: '(sin mensajes)', timestamp: data.timestamp, messages: [] });
    openChat(data.id);
  } catch {
    alert('Error creando conversación');
  } finally {
    creating.value = false;
  }
}

async function send() {
  if (!inputText.value.trim()) return;
  const prompt = inputText.value;
  inputText.value = '';
  try {
    const payload = { user_id: userId, prompt, conversation_id: currentId.value };
    // Enviar al endpoint de mensajes
    const { data } = await api.post('/conversations/message', payload);
    const mapped = data.messages.map(m => ({ id: m.id, from: m.sender, text: m.text, timestamp: m.timestamp }));
    const conv = conversations.value.find(c => c.id === data.conversation_id);
    conv.messages = mapped;
    conv.last_message = mapped[mapped.length - 1].text;
  } catch {
    alert('Error al hablar con el asistente');
  }
}

function logout() {
  localStorage.removeItem('token');
  router.push({ name: 'Home' });
}

onMounted(fetchConversations);
</script>

<style scoped>
.chat-background {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.chat-background.mobile {
  flex-direction: column;
}

/* Slide transition */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.sidebar {
  width: 250px;
  background: rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.chat-window {
  flex: 1;
  background: linear-gradient(-45deg, #001f3f, #002b5b, #003f7d, #005fa3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.chat-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.back-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #fff;
}

.conversation-item.active {
  background: rgba(255,255,255,0.2);
}

.new-chat, .switch {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.messages {
  flex: 1;
  overflow-y: auto;
}

.message {
  margin-bottom: 0.5rem;
  color: #fff;
}

.message.user {
  text-align: right;
}

.input-area {
  display: flex;
  gap: 0.5rem;
}

.input-area input {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
}

.input-area button {
  width: 80px;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: #005fa3;
  color: #fff;
}
</style>
