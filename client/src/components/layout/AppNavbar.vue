5. Dégradé radial fixe avec glow Un halo de couleur (or ou cyan très atténué)
centré en haut de la page, comme un spot de lumière qui éclaire le contenu.
Simple mais classe.
<template>
  <nav
    class="fixed top-0 left-0 right-0 z-40 bg-body/80 backdrop-blur-xl border-b border-border"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 group shrink-0">
          <img
            src="../../assets/logo.png"
            alt="FwitterLeague"
            class="h-9 w-auto group-hover:brightness-125 transition-all"
          />
        </RouterLink>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive(link.to)
                ? 'text-gold bg-gold-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            ]"
          >
            <component
              :is="link.icon"
              :size="16"
              class="inline-block mr-1.5 -mt-0.5"
            />
            {{ link.label }}
          </RouterLink>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-3">
          <template v-if="authStore.user">
            <!-- Notifications -->
            <RouterLink
              to="/notifications"
              :class="[
                'relative p-2 rounded-lg transition-all duration-200',
                isActive('/notifications')
                  ? 'text-gold bg-gold-muted'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
              ]"
            >
              <Bell :size="20" />
              <!-- Red Dot Badge -->
              <span
                v-if="unreadCount > 0"
                class="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-body ring-2 ring-danger/20"
              />
            </RouterLink>

            <!-- User Menu -->
            <div class="relative" ref="menuRef">
              <button
                class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer"
                @click="showMenu = !showMenu"
              >
                <BaseAvatar :name="authStore.profile?.username || '?'" :src="authStore.profile?.avatar_url ?? undefined" size="sm" />
                <span class="text-sm font-medium text-text-primary hidden sm:block">
                  {{ authStore.profile?.username }}
                </span>
                <ChevronDown :size="14" class="text-text-muted" />
              </button>

              <Transition name="fade">
                <div
                  v-if="showMenu"
                  class="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border rounded-xl shadow-xl py-1 overflow-hidden"
                >
                  <RouterLink
                    to="/profile"
                    class="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    @click="showMenu = false"
                  >
                    <User :size="16" />
                    Mon Profil
                  </RouterLink>
                  <div class="h-px bg-border mx-2 my-1" />
                  <button
                    class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-muted transition-colors cursor-pointer"
                    @click="handleSignOut"
                  >
                    <LogOut :size="16" />
                    Déconnexion
                  </button>
                </div>
              </Transition>
            </div>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="px-4 py-2 bg-gold text-body text-sm font-semibold rounded-lg hover:bg-gold-light transition-all duration-200"
            >
              Connexion
            </RouterLink>
          </template>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            @click="showMobile = !showMobile"
          >
            <Menu :size="22" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="slide-up">
      <div
        v-if="showMobile"
        class="md:hidden border-t border-border bg-surface/95 backdrop-blur-xl"
      >
        <div class="px-4 py-3 space-y-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :class="[
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(link.to)
                ? 'text-gold bg-gold-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            ]"
            @click="showMobile = false"
          >
            <component :is="link.icon" :size="18" />
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  Menu,
  Users,
  Shield,
  Award,
  Settings,
  Swords,
  MessageCircle,
  BookOpen,
  Mic,
} from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth";
import { useInboxStore } from "../../stores/inbox";
import BaseAvatar from "../ui/BaseAvatar.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const inboxStore = useInboxStore();

const showMenu = ref(false);
const showMobile = ref(false);
const menuRef = ref<HTMLElement>();

const unreadCount = computed(() => inboxStore.unreadCount);

const isAdmin = computed(
  () =>
    authStore.profile?.role === "admin" ||
    authStore.profile?.role === "superadmin",
);

const navLinks = computed(() => {
  const links = [
    { to: "/tournaments", label: "Tournois", icon: Award },
    { to: "/agents", label: "Mercato", icon: Users },
    { to: "/casters", label: "Casters", icon: Mic },
    { to: "/teams", label: "Équipes", icon: Shield },
    { to: "/rules", label: "Règlement", icon: BookOpen },
    { to: "/contact", label: "Contact", icon: MessageCircle },
  ];
  if (isAdmin.value) {
    links.push(
      { to: "/admin", label: "Admin", icon: Settings },
      { to: "/admin/tournaments", label: "Gestion", icon: Swords },
    );
  }
  return links;
});

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}

async function handleSignOut() {
  showMenu.value = false;
  await authStore.signOut();
  router.push("/");
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    showMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  if (authStore.user) {
    inboxStore.fetchInbox();
  }
});

onUnmounted(() => document.removeEventListener("click", handleClickOutside));

watch(() => authStore.user, (newUser) => {
  if (newUser) {
    inboxStore.fetchInbox();
  }
});
</script>
