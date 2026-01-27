import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/lib/auth/guards';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles="ADMIN">
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </RoleGuard>
  );
}

