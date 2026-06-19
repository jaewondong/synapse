import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ExplainabilityDrawer } from "@/components/synapse/explainability/explainability-drawer";
import "./globals.css";

// Synapse Luminous typography (§2.8): Inter for UI/body, JetBrains Mono for
// IDs/audit metadata. Variable names feed the @theme font tokens in globals.css.
const inter = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse",
  description: "Agent-first EMR cockpit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              // Glass chrome (§3) — rollback/Undo toasts keep their action + kbd
              toast:
                'glass glass--text !rounded-[var(--radius-lg)] !text-[var(--text)] !border-[var(--glass-border)]',
              description: '!text-[var(--text-muted)]',
              actionButton: '!bg-[var(--brand)] !text-[var(--text-on-brand)]',
            },
          }}
        />
        {/* Global Explainability Drawer — mounted exactly once (§2.7); surfaces invoke via store */}
        <ExplainabilityDrawer />
      </body>
    </html>
  );
}
