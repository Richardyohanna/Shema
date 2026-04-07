import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-secondary mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-4">Page Not Found</h2>
        <p className="text-foreground/70 mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back to exploring SHEMA&apos;s mission.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
            Return to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
