/**
 * Coach app route-group layout.
 *
 * Surface: full-bleed obsidian. The coach stage IS the brand expressed
 * as camera + Form Line; there's no chrome around it from this layout.
 * Step 07 swaps the lingering slate-950 ground for the Carriage obsidian
 * variable so the dark surface matches every other surface in the app.
 */
export default function CoachLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#070707]">
      {children}
    </div>
  );
}
