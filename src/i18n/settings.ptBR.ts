/** Player text for the settings window. Keys match ui/preferences.ts. */
import type { PreferenceKey } from "../ui/preferences";

export const SETTINGS_UI = {
  nav: "Config.",
  title: "CONFIGURAÇÕES",
  tabs: { audio: "Áudio", interactivity: "Interatividade", hud: "HUD", performance: "Desempenho", support: "Suporte" },
  on: "ON",
  off: "OFF",
  help: "O que é isto?",
  volumes: "VOLUME",
  support: {
    version: (v: string) => `BugIdle versão ${v}`,
    saveHint: "Seu progresso fica salvo neste navegador a cada 10 segundos. Use Salvar para baixar uma cópia ou levar para outro aparelho.",
    openSave: "Salvar e carregar",
    reset: "Restaurar configurações padrão",
    resetDone: "Configurações restauradas.",
    report: "Achou um bug de verdade? Abra um chamado no repositório do jogo:",
    reportLink: "github.com/filipe-jsales/bugidle/issues",
    shortcuts: "Atalhos: F2 abre o terminal, Esc fecha janelas.",
  },
  immersiveExit: "Sair do modo imersivo",
};

/** Label and "?" explanation for each switch. */
export const PREFERENCE_TEXT: Record<PreferenceKey, { label: string; help: string }> = {
  shinySound: { label: "Som de shiny", help: "Toca um som quando um bug shiny aparece." },
  captureSound: { label: "Som de captura", help: "Toca um som quando a armadilha prende o bug." },
  rareDropSound: { label: "Som de drops raros", help: "Toca um som quando cai um item ou uma pedra, inclusive as dos chefes." },
  achievementSound: { label: "Som de conquista", help: "Toca um som quando você completa uma conquista." },
  immersive: { label: "Modo imersivo", help: "Esconde as colunas laterais e deixa o mapa ocupar a tela. Volte pelo botão no mapa ou aqui." },
  sceneTransparency: { label: "Transparência do cenário", help: "Os painéis por cima do mapa ficam translúcidos, deixando ver o cenário atrás." },
  timeLighting: { label: "Iluminação pelo horário", help: "O mapa escurece à noite e fica alaranjado no fim da tarde, seguindo o relógio do seu aparelho." },
  nameplates: { label: "Nomes sobre os bugs", help: "Mostra nome, nível e vida em cima do seu bug e do inimigo no mapa." },
  hideAchievementToasts: { label: "Ocultar conquistas na tela", help: "Não mostra o aviso quando uma conquista é completada. Ela continua no registro e na janela de Conquistas." },
  nightMode: { label: "Modo noturno", help: "Painéis mais escuros, para jogar com pouca luz." },
  phoneLayout: { label: "Layout de celular", help: "Em telas pequenas, organiza o jogo em uma coluna. Desligado, o celular mostra a versão de computador (use o zoom do navegador)." },
  optimized: { label: "Modo otimizado", help: "Menos efeitos e animações e o mapa a 30 quadros por segundo. Ajuda em aparelhos mais fracos." },
  economy: { label: "Modo economia", help: "O mapa anda a 20 quadros por segundo e os ataques ficam sem efeitos. Gasta menos bateria." },
  keepScreenOn: { label: "Tela sempre acesa", help: "Impede que a tela apague sozinha enquanto o jogo está aberto, se o navegador permitir." },
  ultraEconomy: { label: "Modo ULTRA economia", help: "O mapa quase para (4 quadros por segundo) e a música desliga. O jogo continua caçando normalmente." },
};
