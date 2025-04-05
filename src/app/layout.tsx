import type { Metadata } from "next";

import "../index.css";

export const metadata: Metadata = {
  title: "Letter Boxed Solver",
  description: "A solver for the Letter Boxed game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
