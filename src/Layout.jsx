import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`
        :root {
          --color-atlantic-blue: #171717;
          --color-atlantic-blue-dark: #0a0a0a;
        }
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
      `}</style>
      
      {children}
    </div>
  );
}