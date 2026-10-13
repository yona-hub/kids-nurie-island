import { createRoot } from "react-dom/client";
import App from "./App";
import { services } from './app-context';
import { registerPwaUpdates } from './pwa-updates';
import { navigationAllowsUpdate } from './navigation';
import "./styles.css";
import "./styles-ui-art.css";
import "./styles-illustrated-ui.css";
import "./styles-palette-art.css";
import "./styles-palette.css";

createRoot(document.getElementById("root")!).render(<App />);
if (import.meta.env.PROD) void registerPwaUpdates(() => navigationAllowsUpdate() && !services.sync.status.localSaveFailed);
