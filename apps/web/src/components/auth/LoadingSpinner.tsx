import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  fullPage = false,
}) => {
  if (fullPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className={cn('h-8 w-8 animate-spin text-primary', className)} />
      </div>
    );
  }

  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted-foreground', className)} />;
};
