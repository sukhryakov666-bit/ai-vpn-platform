import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AI VPN Admin Web",
  description: "Admin and user cabinet for AI-assisted VPN platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
