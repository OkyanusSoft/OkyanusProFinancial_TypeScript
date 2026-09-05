import React from "react";
import ReactDOM from "react-dom/client";

/* ═══════════ الخطوط المحلية — تعمل دون اتصال بالإنترنت (لا Google Fonts) ═══════════ */
/* Changa — خط العناوين (display) */
import "@fontsource/changa/400.css";
import "@fontsource/changa/500.css";
import "@fontsource/changa/600.css";
import "@fontsource/changa/700.css";
import "@fontsource/changa/800.css";
/* Tajawal — خط النصوص الأساسي (body) */
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/tajawal/900.css";
/* Space Grotesk — خط الأرقام والأكواد اللاتينية (num) */
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";

import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
