import React from "react";

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        /* Ensure the Next.js root and layout wrapper fill the viewport */
        #__next, .widget-root {
          width: 100%;
          height: 100%;
          background: transparent !important;
        }
      `}} />
      <div className="widget-root">
        {children}
      </div>
    </>
  );
}
