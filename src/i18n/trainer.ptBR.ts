/** Texts of the trainer card and the look editor. */
import type { LookPart, LookRequirement } from "../game/trainerLook";

export const TRAINER_UI = {
  title: "TREINADOR",
  nav: "Cartão",
  tabs: { card: "CARTÃO", look: "VISUAL" },
  name: "Nome",
  turn: "Girar",
  level: (n: number) => `Caçador nível ${n}`,
  since: (date: string) => `caçando desde ${date}`,
  stats: "ESTATÍSTICAS",
  stat: {
    playTime: "Tempo de jogo",
    defeats: "Bugs derrotados",
    captures: "Capturas",
    shinies: "Shinies",
    evolutions: "Evoluções",
    hatched: "Ovos chocados",
    dex: "Bugdex",
    achievements: "Conquistas",
    streak: "Maior sequência de estudo",
    games: "Partidas de mini games",
  },
  medals: "INSÍGNIAS",
  medalLocked: "ainda não conquistada",
  favorite: "BUG FAVORITO",
  favoriteAuto: "o de maior nível (escolha outro abaixo)",
  pickFavorite: "Trocar favorito",
  autoFavorite: "Usar o de maior nível",
  noBugs: "Escolha seu primeiro bug para preencher o cartão.",
  lookIntro: "Escolha o visual do seu caçador. Ele aparece no mapa e no perfil. Algumas opções especiais são conquistadas jogando.",
  random: "Aleatório",
  reset: "Visual padrão",
  locked: "bloqueado",
};

export const LOOK_PART_NAMES: Record<LookPart, string> = {
  headwear: "Chapéu",
  headColor: "Cor do chapéu",
  hair: "Cabelo",
  skin: "Pele",
  jacket: "Jaqueta",
  pants: "Calça",
  backpack: "Mochila",
};

export const HEADWEAR_NAMES: Record<string, string> = { cap: "Boné", beanie: "Gorro", none: "Sem chapéu" };

export const LOOK_OPTION_NAMES: Record<string, string> = {
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
  black: "Preto",
  purple: "Roxo",
  orange: "Laranja",
  white: "Branco",
  shiny: "Shiny",
  brown: "Castanho",
  blond: "Loiro",
  tone1: "Tom 1",
  tone2: "Tom 2",
  tone3: "Tom 3",
  tone4: "Tom 4",
  tone5: "Tom 5",
  teal: "Turquesa",
  gold: "Dourada",
  navy: "Marinho",
  gray: "Cinza",
  leather: "Couro",
  legend: "Lendária",
};

export const REQUIREMENT_TEXT: Record<LookRequirement, string> = {
  shiny: "Capture um bug shiny para liberar",
  firstBadge: "Vença o primeiro chefe para liberar",
  allBadges: "Vença todos os chefes para liberar",
};
