import Link from "next/link";
import { Icon, type IconName } from "@/components/atoms/Icon";

export function NavItem({ href, label, icon, active = false }: { href: string; label: string; icon: IconName; active?: boolean }) {
  return (
    <Link className={`nav-item${active ? " nav-item--active" : ""}`} href={href}>
      <Icon name={icon} size={18} />
      <span>{label}</span>
    </Link>
  );
}
