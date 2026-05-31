import { OwnerAppShell } from '@/components/owner/OwnerAppShell';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerAppShell>{children}</OwnerAppShell>;
}
