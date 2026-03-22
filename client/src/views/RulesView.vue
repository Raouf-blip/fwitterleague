<template>
  <div>
    <PageHeader title="Règlement" subtitle="Principe du site et règles des tournois FwitterLeague." />

    <div class="space-y-8 mt-8">
      <!-- Section Principe -->
      <section>
        <h2 class="text-2xl font-bold text-gold mb-4 flex items-center gap-2">
          <Info :size="24" />
          Principe du site
        </h2>
        <BaseCard :hoverable="false" class="bg-surface/50">
          <div class="prose prose-invert max-w-none text-text-secondary">
            <p class="mb-4">
              Bienvenue sur <strong>FwitterLeague</strong>, la plateforme dédiée à la gestion de vos compétitions e-sport.
            </p>
            <p class="mb-4">
              Notre objectif est de fournir un environnement structuré et professionnel pour les équipes et les joueurs.
              Ici, vous pouvez :
            </p>
            <ul class="list-disc pl-6 space-y-2 mb-4">
              <li>Créer et gérer votre équipe.</li>
              <li>Participer à des tournois officiels.</li>
              <li>Recruter des joueurs ou trouver une équipe via le système de Mercato.</li>
              <li>Suivre vos performances et votre historique de matchs.</li>
            </ul>
            <p>
              La FwitterLeague se veut être un espace compétitif sain, où le fair-play et le respect sont primordiaux.
            </p>
          </div>
        </BaseCard>
      </section>

      <!-- Section Règlement -->
      <section>
        <h2 class="text-2xl font-bold text-gold mb-4 flex items-center gap-2">
          <BookOpen :size="24" />
          Règlement des tournois
        </h2>
        <div class="grid gap-6 md:grid-cols-2">
           <BaseCard :hoverable="false" class="h-full">
            <h3 class="text-xl font-semibold text-text-primary mb-3 flex items-center gap-2">
              <UserCheck :size="20" class="text-primary" />
              Inscription et Éligibilité
            </h3>
            <ul class="space-y-2 text-text-secondary text-sm">
              <li class="flex gap-2">
                <span class="text-primary">•</span>
                Chaque équipe doit être complète et enregistrée avant la date limite.
              </li>
              <li class="flex gap-2">
                <span class="text-primary">•</span>
                Les joueurs doivent avoir leur compte de jeu lié à leur profil.
              </li>
              <li class="flex gap-2">
                <span class="text-primary">•</span>
                Un joueur ne peut appartenir qu'à une seule équipe par tournoi.
              </li>
            </ul>
          </BaseCard>

          <BaseCard :hoverable="false" class="h-full">
            <h3 class="text-xl font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Clock :size="20" class="text-warning" />
              Format de la Compétition
            </h3>
            <ul class="space-y-2 text-text-secondary text-sm">
              <li class="flex gap-2 items-start">
                <span class="text-warning shrink-0">•</span>
                <span>Format inspiré de la <strong>LEC</strong> (League of Legends EMEA Championship).</span>
              </li>
              <li class="flex gap-2 items-start">
                <span class="text-warning shrink-0">•</span>
                <span><strong>Saison Régulière :</strong> Système de poule unique où chaque équipe affronte toutes les autres.</span>
              </li>
              <li class="flex gap-2 items-start">
                <span class="text-warning shrink-0">•</span>
                <span><strong>Playoffs :</strong> Les meilleures équipes du classement se qualifient pour la phase finale.</span>
              </li>
            </ul>
          </BaseCard>

          <BaseCard :hoverable="false" class="h-full">
            <h3 class="text-xl font-semibold text-text-primary mb-3 flex items-center gap-2">
              <ShieldAlert :size="20" class="text-danger" />
              Fair-play et Comportement
            </h3>
            <ul class="space-y-2 text-text-secondary text-sm">
              <li class="flex gap-2">
                <span class="text-danger">•</span>
                Toute insulte, racisme ou comportement toxique est strictement interdit.
              </li>
              <li class="flex gap-2">
                <span class="text-danger">•</span>
                L'utilisation de logiciels de triche (hacks, scripts) entraîne un bannissement immédiat.
              </li>
              <li class="flex gap-2">
                <span class="text-danger">•</span>
                Respectez les administrateurs et leurs décisions.
              </li>
            </ul>
          </BaseCard>
           <BaseCard :hoverable="false" class="h-full">
            <h3 class="text-xl font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Gavel :size="20" class="text-gold" />
              Sanctions
            </h3>
            <ul class="space-y-2 text-text-secondary text-sm">
              <li class="flex gap-2">
                <span class="text-gold">•</span>
                Avertissement pour les infractions mineures.
              </li>
              <li class="flex gap-2">
                <span class="text-gold">•</span>
                Disqualification du tournoi en cas de récidive ou faute grave.
              </li>
              <li class="flex gap-2">
                <span class="text-gold">•</span>
                Bannissement temporaire ou définitif de la plateforme.
              </li>
            </ul>
          </BaseCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookOpen, Info, ShieldAlert, Clock, UserCheck, Gavel } from 'lucide-vue-next'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
</script>