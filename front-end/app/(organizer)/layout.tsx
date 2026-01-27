import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/lib/auth/guards';

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['ORGANIZER', 'ADMIN']}>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </RoleGuard>
  );
}

