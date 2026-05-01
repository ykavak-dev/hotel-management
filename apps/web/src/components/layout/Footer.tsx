export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">HotelHub</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 HotelHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};