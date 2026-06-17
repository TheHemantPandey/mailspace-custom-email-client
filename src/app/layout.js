import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mail Dashboard | Premium Workspace",
  description: "Secure, synchronized email management system",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Deep navy/slate background for a highly premium, modern interface */}
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}