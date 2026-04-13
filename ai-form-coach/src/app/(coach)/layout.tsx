export default function CoachLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen h-[100dvh] flex-col overflow-hidden bg-slate-950">
      {children}
    </div>
  );
}
