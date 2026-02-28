import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "FirstJobs — Land Your Dream Placement",
  description: "AI-powered placement preparation platform with company profiles, practice quizzes, interview questions, and previous year papers. Prepare smarter, not harder.",
  keywords: "placement preparation, campus recruitment, interview questions, aptitude quiz, previous year papers, company profiles",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
