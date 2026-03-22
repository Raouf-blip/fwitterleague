<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <img src="../assets/logo.png" alt="FwitterLeague" class="h-20 w-auto mx-auto mb-3" />
        <p class="text-sm text-text-secondary mt-1">
          Plateforme de tournois League of Legends
        </p>
      </div>

      <BaseCard :hoverable="false" class="!p-6">
        <h2 class="text-xl font-bold text-text-primary text-center mb-4">
          Mot de passe oublié
        </h2>
        <p class="text-sm text-text-secondary text-center mb-6">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        <form @submit.prevent="handleReset" class="space-y-4">
          <BaseInput
            label="Email"
            v-model="email"
            type="email"
            placeholder="ton@email.com"
            required
          />

          <BaseButton
            type="submit"
            variant="primary"
            class="w-full"
            :loading="loading"
          >
            Envoyer le lien
          </BaseButton>

          <p
            v-if="message"
            class="text-sm text-center font-medium"
            :class="success ? 'text-green-500' : 'text-danger'"
          >
            {{ message }}
          </p>
        </form>

        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-sm text-gold hover:text-gold-light transition-colors"
          >
            Retour à la connexion
          </router-link>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "../lib/supabase";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseButton from "../components/ui/BaseButton.vue";

const email = ref("");
const loading = ref(false);
const message = ref("");
const success = ref(false);

async function handleReset() {
  loading.value = true;
  message.value = "";
  success.value = false;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    success.value = true;
    message.value =
      "Un email de réinitialisation a été envoyé. Si vous ne le recevez pas, pensez à vérifier votre dossier de spams.";
  } catch (error: any) {
    message.value = error.message || "Une erreur est survenue.";
  } finally {
    loading.value = false;
  }
}
</script>
