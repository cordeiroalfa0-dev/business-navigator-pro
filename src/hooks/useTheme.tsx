import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "medium" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const CYCLE: Theme[] = ["light", "medium", "dark"];

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(t: Theme) {
  const root = document.documentElement;
  // Bloqueia transições CSS por 1 frame para evitar piscar
  root.classList.add("theme-switching");
  root.classList.remove("light", "medium", "dark", "dark");
  root.classList.add(t);
  if (t === "dark") root.classList.add("dark");
  // remove a classe no próximo frame, depois que o browser aplicou os estilos
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove("theme-switching");
    });
  });
  localStorage.setItem("app-theme", t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("app-theme");
      return (saved === "light" || saved === "medium" || saved === "dark") ? saved as Theme : "dark";
    } catch { return "dark"; }
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  const toggleTheme = () => {
    setThemeState(prev => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
