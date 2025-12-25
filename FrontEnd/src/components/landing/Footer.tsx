export function Footer() {
  return (
    <footer className="py-8 px-4 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-text-muted text-sm">
          © 2024 EduMind. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-text-muted hover:text-text-secondary transition-colors text-sm">
            Privacy
          </a>
          <a href="#" className="text-text-muted hover:text-text-secondary transition-colors text-sm">
            Terms
          </a>
          <a href="#" className="text-text-muted hover:text-text-secondary transition-colors text-sm">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
