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
          Créer un nouveau mot de passe
        </h2>
        <p class="text-sm text-text-secondary text-center mb-6">
          Veuillez saisir votre nouveau mot de passe.
        </p>

        <form @submit.prevent="handleUpdatePassword" class="space-y-4">
          <BaseInput
            label="Nouveau mot de passe"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />

          <BaseButton
            type="submit"
            variant="primary"
            class="w-full"
            :loading="loading"
          >
            Réinitialiser le mot de passe
          </BaseButton>

          <p
            v-if="message"
            class="text-sm text-center font-medium"
            :class="success ? 'text-green-500' : 'text-danger'"
          >
            {{ message }}
          </p>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseButton from "../components/ui/BaseButton.vue";

const router = useRouter();
const password = ref("");
const loading = ref(false);
const message = ref("");
const success = ref(false);

onMounted(async () => {
  // Check if we have a session to allow password update
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    message.value =
      "Session invalide ou expirée. Veuillez redemander un lien de réinitialisation.";
  }
});

async function handleUpdatePassword() {
  loading.value = true;
  message.value = "";
  success.value = false;

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    });

    if (error) throw error;

    success.value = true;
    message.value = "Mot de passe mis à jour avec succès ! Redirection...";
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (error: any) {
    message.value = error.message || "Une erreur est survenue.";
  } finally {
    loading.value = false;
  }
}
</script>
