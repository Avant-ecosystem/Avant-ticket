import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/lib/auth/guards';

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </AuthGuard>
  );
}

