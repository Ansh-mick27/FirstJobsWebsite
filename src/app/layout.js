import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Paradox",
  description: "AI-powered placement preparation platform with company profiles, mock tests, interview practice, and previous year questions. Prepare smarter, not harder.",
  keywords: "placement preparation, campus recruitment, interview questions, mock test, previous year papers, company profiles",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
