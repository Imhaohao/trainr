import { AuthNavbar } from '@/components/layout/AppNavbars';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <AuthNavbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
