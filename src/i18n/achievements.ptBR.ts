/** Player text for achievements. Ids match game/achievements.ts. */
import type { AchievementGroup } from "../game/achievements";

export const ACHIEVEMENT_TEXT: Record<string, { name: string; description: string }> = {
  dex5: { name: "Primeiros Registros", description: "Capture 5 espécies diferentes." },
  dex15: { name: "Catálogo de Erros", description: "Capture 15 espécies diferentes." },
  dex30: { name: "Base de Conhecimento", description: "Capture 30 espécies diferentes." },
  dexAll: { name: "Bugdex Completa", description: "Capture todas as espécies." },
  catch50: { name: "Caçador Dedicado", description: "Faça 50 capturas." },
  catch500: { name: "Rede de Arrasto", description: "Faça 500 capturas." },
  shiny1: { name: "Brilho Raro", description: "Consiga um bug shiny." },
  shiny5: { name: "Coleção Dourada", description: "Consiga 5 bugs shiny." },
  defeat100: { name: "Primeira Centena", description: "Derrote 100 bugs." },
  defeat1000: { name: "Caçador de Mil", description: "Derrote 1.000 bugs." },
  defeat10000: { name: "Zero Bugs Conhecidos", description: "Derrote 10.000 bugs." },
  boss1: { name: "Primeiro Deploy", description: "Vença um chefe." },
  bossAll: { name: "Produção Estável", description: "Vença todos os chefes." },
  evolve1: { name: "Refatoração", description: "Evolua um bug." },
  evolve10: { name: "Versão Nova", description: "Evolua 10 bugs." },
  refine1: { name: "Polimento", description: "Refine um atributo." },
  refine50: { name: "Otimização Extrema", description: "Faça 50 refinos." },
  hatch1: { name: "Novo Processo", description: "Choque um ovo." },
  hatch20: { name: "Fábrica de Bugs", description: "Choque 20 ovos." },
  held1: { name: "Bem Equipado", description: "Equipe um item em um bug." },
  held6: { name: "Equipe Completa", description: "Tenha 6 bugs com itens equipados." },
  trainer10: { name: "Desenvolvedor Pleno", description: "Chegue ao nível 10 de caçador." },
  trainer30: { name: "Desenvolvedor Sênior", description: "Chegue ao nível 30 de caçador." },
  house1: { name: "Primeiro Endereço", description: "Construa uma casa." },
  houseAll: { name: "Bairro da Computação", description: "Construa uma casa de cada categoria." },
  houseMax: { name: "Estado da Arte", description: "Leve uma casa até o último marco." },
  raid1: { name: "Primeira Missão", description: "Conclua uma missão da Guilda." },
  study10: { name: "Estudante", description: "Estude 10 bugs no desafio do dia." },
};

export const ACHIEVEMENT_GROUPS: Record<AchievementGroup, string> = {
  collection: "COLEÇÃO",
  battle: "BATALHA",
  growth: "CRESCIMENTO",
  world: "MUNDO",
};

export const ACHIEVEMENTS_UI = {
  title: "CONQUISTAS",
  intro: "Metas de longo prazo. Cada uma paga moedas uma única vez.",
  unlocked: (n: number, total: number) => `${n} de ${total} conquistadas`,
  reward: (coins: string) => `${coins} moedas`,
  done: "Feito",
  toast: (name: string, coins: string) => `Conquista: ${name}! +${coins} moedas`,
  nav: "Conquistas",
};
