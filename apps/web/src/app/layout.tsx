import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Regulatory — Prospectus Composer",
    template: "%s · Regulatory",
  },
  description: "Questionnaire réglementaire et génération traçable de prospectus OPCVM/FCP UMOA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
