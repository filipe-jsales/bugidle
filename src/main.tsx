import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/700.css";
import "@fontsource/silkscreen/400.css";
import "./ui/styles.css";
import "./ui/learning.css";
import "./ui/polish.css";
import "./ui/features.css";
import "./ui/edu.css";
import "./ui/minigames.css";
import { App } from "./ui/App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
