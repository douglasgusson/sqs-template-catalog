import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast-provider";

import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pigeon SQS Dispatcher",
  description: "Catálogo de templates e dispatcher para testes de mensagens SQS em arquiteturas orientadas a eventos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("dark font-sans", figtree.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
