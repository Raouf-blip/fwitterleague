<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notifications'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

onMounted(async () => {
  await authStore.initialize()
})
</script>

<template>
  <!-- Toast System -->
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in notificationStore.notifications" 
        :key="toast.id" 
        class="toast-card card" 
        :class="toast.type"
        @click="notificationStore.remove(toast.id)"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✓</span>
          <span v-else-if="toast.type === 'error'">✕</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </TransitionGroup>
  </div>

  <nav class="main-nav">
    <div class="logo">FWITTERLEAGUE</div>
    <ul class="nav-links">
      <li><RouterLink to="/" active-class="active">Accueil</RouterLink></li>
      <li><RouterLink to="/tournaments" active-class="active">Tournois</RouterLink></li>
      <li><RouterLink to="/agents" active-class="active">Agents Libres</RouterLink></li>
      <li><RouterLink to="/teams" active-class="active">Équipes</RouterLink></li>
      <li v-if="!authStore.user"><RouterLink to="/login" active-class="active">Connexion</RouterLink></li>
      <template v-else>
        <li><RouterLink to="/notifications" active-class="active">Notifications</RouterLink></li>
        <li><RouterLink to="/profile" active-class="active">Mon Profil</RouterLink></li>
      </template>
    </ul>
  </nav>

  <main class="container">
    <RouterView v-if="!authStore.loading" />
    <div v-else class="loading-screen">Chargement...</div>
  </main>

  <footer>
    <p>&copy; 2026 FwitterLeague - Indépendant</p>
  </footer>
</template>

<style>
:root {
  --primary-color: #0bc6e3;
  --secondary-color: #1e2328;
  --bg-color: #010a13;
  --text-color: #f0e6d2;
  --accent-color: #c89b3c;
  --border-color: #a09448;
}

body {
  margin: 0;
  font-family: 'Beaufort for LoL', serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
}

.main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--secondary-color);
  border-bottom: 2px solid var(--border-color);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent-color);
  letter-spacing: 2px;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 1.5rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: color 0.3s;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.nav-links a:hover, .nav-links a.active {
  color: var(--accent-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 80vh;
}

footer {
  text-align: center;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 1.2rem;
  color: var(--accent-color);
}

/* Common UI Elements */
.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  transition: 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: var(--accent-color);
  color: var(--bg-color);
  border: 1px solid var(--accent-color);
}

.btn-primary:hover {
  background-color: #eab33d;
}

.btn-secondary {
  background-color: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
}

.btn-secondary:hover {
  background-color: rgba(200, 155, 60, 0.1);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.card {
  background: rgba(30, 35, 40, 0.7);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  border-color: var(--accent-color);
}

/* Toast Styles */
.toast-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  min-width: 300px;
  background: #1e2328;
  border: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  cursor: pointer;
  border-left: 4px solid var(--accent-color);
}

.toast-card.success { border-left-color: #4dff4d; }
.toast-card.error { border-left-color: #ff4d4d; }
.toast-card.warning { border-left-color: #f7a01d; }

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.toast-card.success .toast-icon { color: #4dff4d; }
.toast-card.error .toast-icon { color: #ff4d4d; }

.toast-message {
  font-size: 0.95rem;
  color: #f0e6d2;
}

/* Transitions */
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
