// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AppLayout
import React from 'react';
import { Header as SiteHeader } from '../components/Header/Header';
import { Footer as SiteFooter } from '../components/Footer/Footer';
import { ContextMenu as PageMenu } from '../components/ContextMenu/ContextMenu';

export function AppLayout({ children }) {
  return (
    <div className="portfolio-shell relative min-h-screen flex flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-grow flex flex-col w-full">
        {children}
      </main>
      <SiteFooter />
      <PageMenu />
    </div>
  );
}
// codeguard:components:end
