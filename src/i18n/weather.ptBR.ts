/** Player text for weather and time of day. */
import type { TimeOfDay, Weather } from "../game/weather";

export const WEATHER_TEXT: Record<Weather, { name: string; effect: string }> = {
  clear: { name: "Céu limpo", effect: "encontros normais" },
  rain: { name: "Chuva", effect: "mais bugs de Rede" },
  storm: { name: "Tempestade", effect: "mais bugs de Concorrência e de Rede" },
  fog: { name: "Neblina", effect: "mais bugs de Lógica e de Interface" },
  heat: { name: "Calor", effect: "mais bugs de Desempenho e de Memória" },
};

export const TIME_TEXT: Record<TimeOfDay, { name: string; effect: string }> = {
  day: { name: "Dia", effect: "" },
  dusk: { name: "Entardecer", effect: "bugs raros um pouco mais comuns" },
  night: { name: "Noite", effect: "bugs raros e lendários mais comuns" },
};

export const WEATHER_UI = {
  changesIn: (minutes: number) => `muda em ${minutes} min`,
};
