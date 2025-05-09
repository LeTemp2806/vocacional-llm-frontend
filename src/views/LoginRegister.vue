<template>
    <div class="app-container">
      <div class="app-name">Peñin</div>
  
      <div v-if="mode === 'login'">
        <form @submit.prevent="handleLogin">
          <input v-model="email" type="email" placeholder="Correo electrónico" required />
          <input v-model="password" type="password" placeholder="Contraseña" required />
          <button type="submit" :disabled="loading">{{ loading ? 'Ingresando…' : 'Iniciar sesión' }}</button>
        </form>
        <div class="toggle-link" @click="mode = 'register'">¿No tienes cuenta? Regístrate</div>
      </div>
  
      <div v-else>
        <form @submit.prevent="handleRegister">
          <input v-model="name" type="text" placeholder="Nombre completo" required />
          <input v-model="email" type="email" placeholder="Correo electrónico" required />
          <input v-model="password" type="password" placeholder="Contraseña" required />
          <button type="submit" :disabled="loading">{{ loading ? 'Registrando…' : 'Registrar' }}</button>
        </form>
        <div class="toggle-link" @click="mode = 'login'">¿Ya tienes cuenta? Inicia sesión</div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '../api';
  
  const mode = ref('login');
  const email = ref('');
  const password = ref('');
  const name = ref('');
  const loading = ref(false);
  const router = useRouter();
  
  async function handleLogin() {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/login', { email: email.value, password: password.value });
      localStorage.setItem('token', data.access_token);
      router.push({ name: 'Chat' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error en login');
    } finally {
      loading.value = false;
    }
  }
  
  async function handleRegister() {
    loading.value = true;
    try {
      await api.post('/auth/register', { name: name.value, email: email.value, password: password.value });
      // Tras registro, auto-login o redirigir a login
      mode.value = 'login';
      alert('Registro exitoso. Ya puedes iniciar sesión.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error en registro');
    } finally {
      loading.value = false;
    }
  }
  </script>
  
  <style scoped>
  /* Scoped styles sin cambios */
  </style>