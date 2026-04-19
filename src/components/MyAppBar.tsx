import { Button } from "@/components/ui/button";

// GitHub mark — Lucide v1 dropped brand icons.
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.34-1.27-1.7-1.27-1.7-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.95.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.87-.38.98 0 1.96.13 2.87.38 2.18-1.48 3.14-1.17 3.14-1.17.63 1.58.24 2.75.12 3.04.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.26 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56 4.56-1.53 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const MyAppBar = () => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow">
      <div className="flex h-14 items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="GitHub"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => {
            window.location.href = "https://github.com/aaron-ang/letter-boxed";
          }}
        >
          <GithubIcon />
        </Button>
        <h1 className="flex-1 text-lg">Letter Boxed</h1>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => window.open("https://forms.gle/fVdX9G4wSNjPkMTA7")}
        >
          Feedback
        </Button>
      </div>
    </header>
  );
};

export default MyAppBar;
