import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Models Intelligence Dashboard",
  description:
    "Compare, analyze and choose top commercial AI models — pricing, context, multimodality, benchmarks, compliance, lifecycle and AI-powered recommendations.",
  applicationName: "AI Models Intelligence Dashboard",
  authors: [{ name: "MoroHub" }],
  keywords: ["AI models", "LLM comparison", "pricing", "benchmarks", "Gemini", "GPT", "Claude"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1322" },
  ],
};

// Runs before paint to apply the saved theme and avoid a flash of the wrong mode.
const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
