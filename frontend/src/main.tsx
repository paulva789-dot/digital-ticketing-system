import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import "./i18n";
import "./index.css";
import { PremiumProvider } from "./premium";
import { ThemeProvider } from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PremiumProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
