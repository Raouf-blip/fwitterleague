<template>
  <div class="login-container">
    <div class="login-card card">
      <h2>{{ isSignUp ? 'Inscription' : 'Connexion' }}</h2>
      <form @submit.prevent="handleAuth">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div v-if="isSignUp" class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="auth-buttons">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Chargement...' : (isSignUp ? "S'inscrire" : 'Se connecter') }}
          </button>
        </div>
      </form>
      <div class="switch-auth">
        <p v-if="!isSignUp">
          Pas de compte ? <a href="#" @click.prevent="isSignUp = true">Inscrivez-vous</a>
        </p>
        <p v-else>
          Déjà un compte ? <a href="#" @click.prevent="isSignUp = false">Connectez-vous</a>
        </p>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const username = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const router = useRouter()

async function handleAuth() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    if (isSignUp.value) {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            username: username.value
          }
        }
      })
      if (error) throw error
      if (data.user && data.session) {
        router.push('/profile')
      } else {
        successMsg.value = "Inscription réussie ! (Vérifiez vos emails si la confirmation est activée)"
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (error) throw error
      router.push('/profile')
    }
  } catch (err: any) {
    if (err.message.includes('rate limit')) {
      errorMsg.value = "Trop de tentatives. Veuillez attendre quelques minutes ou désactivez 'Confirm Email' dans le dashboard Supabase."
    } else {
      errorMsg.value = err.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--accent-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ccc;
}

input {
  width: 100%;
  padding: 0.8rem;
  background: #121921;
  border: 1px solid var(--border-color);
  color: white;
  box-sizing: border-box;
}

.auth-buttons {
  margin-top: 2rem;
}

.btn {
  width: 100%;
}

.switch-auth {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.switch-auth a {
  color: var(--accent-color);
  text-decoration: none;
}

.error-msg {
  color: #ff4d4d;
  margin-top: 1rem;
  text-align: center;
}

.success-msg {
  color: #4dff4d;
  margin-top: 1rem;
  text-align: center;
}
</style>
