import { useState, type ComponentType, type PropsWithChildren, type SVGProps } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../lib/auth-context";
import { getDefaultRedirect, type PortalRole } from "../lib/auth";
import { cn } from "../lib/utils";
import {
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  EditIcon,
  GaugeIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  LogOutIcon,
  SettingsIcon,
} from "./dashboard/dashboard-icons";
import { ConfirmDialog } from "./confirm-dialog";
import { RoleSwitcher } from "./role-switcher";

type ShellNavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function SidebarNavLink({
  item,
  showActiveState = true,
}: {
  item: ShellNavItem;
  showActiveState?: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#f5f5f5] text-slate-500 transition-colors group-hover:text-slate-900">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="truncate">{item.label}</span>
    </>
  );

  if (!showActiveState) {
    return (
      <Link
        className="group flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-slate-600 transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
        to={item.href}
      >
        {content}
      </Link>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "group flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10",
          isActive
            ? "akara-sidebar-link-active bg-[#171717] text-white"
            : "text-slate-600 hover:bg-[#f5f5f5] hover:text-slate-950"
        )
      }
      to={item.href}
    >
      {content}
    </NavLink>
  );
}

const mainNavItemsByRole = {
  mahasiswa: [
    { href: "/mahasiswa/dashboard", label: "Dashboard", icon: GaugeIcon },
    { href: "/mahasiswa/modul", label: "Mata Kuliah Saya", icon: GraduationCapIcon },
    { href: "/mahasiswa/tugas", label: "Tugas", icon: ClipboardIcon },
    { href: "/mahasiswa/jadwal", label: "Jadwal", icon: CalendarIcon },
  ],
  dosen: [
    { href: "/dosen/dashboard", label: "Dashboard", icon: GaugeIcon },
    { href: "/dosen/mata-kuliah", label: "Mata Kuliah", icon: GraduationCapIcon },
    { href: "/dosen/review-tugas", label: "Review Tugas", icon: ClipboardIcon },
    { href: "/dosen/review-kuis", label: "Review Kuis", icon: EditIcon },
  ],
} satisfies Record<PortalRole, ShellNavItem[]>;

const shellCopyByRole = {
  mahasiswa: {
    areaLabel: "Area mahasiswa",
    areaMeta: "Kelas 12 - A | Perhotelan",
    defaultEmail: "mahasiswa@akara.sch.id",
    defaultName: "Muhammad Fadlil Habill",
    navAriaLabel: "Navigasi mahasiswa",
    subtitle: "Portal belajar mahasiswa",
  },
  dosen: {
    areaLabel: "Area dosen",
    areaMeta: "Teknologi Informasi | Semester berjalan",
    defaultEmail: "dosen@akara.sch.id",
    defaultName: "Dosen Akara",
    navAriaLabel: "Navigasi dosen",
    subtitle: "Ruang kerja dosen",
  },
} satisfies Record<
  PortalRole,
  {
    areaLabel: string;
    areaMeta: string;
    defaultEmail: string;
    defaultName: string;
    navAriaLabel: string;
    subtitle: string;
  }
>;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AppShellProps = PropsWithChildren<{
  fullWidth?: boolean;
  hideSidebar?: boolean;
}>;

export function AppShell({ children, fullWidth = false, hideSidebar = false }: AppShellProps) {
  const { user, signOut } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const activeRole = user?.activeRole ?? "mahasiswa";
  const shellCopy = shellCopyByRole[activeRole];
  const profileName = user?.name || shellCopy.defaultName;
  const profileEmail = user?.email || shellCopy.defaultEmail;
  const footerNavItems: ShellNavItem[] = [
    { href: getDefaultRedirect(activeRole), label: "Bantuan", icon: HelpCircleIcon },
    { href: "/profile", label: "Profil & Pengaturan", icon: SettingsIcon },
  ];

  async function handleLogoutConfirm() {
    setIsSigningOut(true);

    try {
      await signOut();
      setIsLogoutDialogOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div
      className={cn(
        "akara-workspace-shell min-h-screen bg-[var(--workspace-page-bg)] text-slate-950",
        !hideSidebar && "lg:pl-[228px]"
      )}
    >
      {!hideSidebar ? (
        <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[228px] flex-col border-r border-[#e5e5e5] bg-white px-4 py-5 lg:flex">
          <Link
            className="group flex min-h-12 items-center gap-3 border-b border-[#eeeeee] pb-5 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
            to={getDefaultRedirect(activeRole)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-[12px] font-bold text-white">
              A
            </span>
            <span className="min-w-0 leading-none">
              <span className="block text-[15px] font-semibold tracking-[-0.03em] text-slate-950">Akara LMS</span>
              <span className="mt-1.5 block truncate text-[10px] font-medium text-slate-500">
                {shellCopy.subtitle}
              </span>
            </span>
          </Link>

          <div className="mt-7 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Navigasi utama
            </p>
          </div>

          <nav className="mt-3 flex flex-1 flex-col gap-1.5" aria-label={shellCopy.navAriaLabel}>
            {mainNavItemsByRole[activeRole].map((item) => (
              <SidebarNavLink key={item.label} item={item} />
            ))}
          </nav>

          <div className="mt-6 border-t border-[#eeeeee] pt-5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Akun
            </p>
            <nav className="mt-3 flex flex-col gap-1.5" aria-label="Navigasi akun">
              {footerNavItems.map((item) => (
                <SidebarNavLink
                  key={item.label}
                  item={item}
                  showActiveState={item.href === "/profile"}
                />
              ))}
            </nav>
          </div>
        </aside>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/[0.88] px-2.5 py-2 backdrop-blur-xl shadow-[0_18px_42px_-42px_rgba(15,23,42,0.32)] sm:px-3.5 lg:px-4">
        <div
          className={cn(
            "mx-auto flex w-full items-center justify-between gap-3",
            fullWidth ? "max-w-none" : "max-w-[1480px]"
          )}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {shellCopy.areaLabel}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-700">
              {shellCopy.areaMeta}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <RoleSwitcher />
            <button
              aria-label="Notifikasi"
              className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[13px] border border-slate-200/80 bg-white text-slate-500 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.5)] transition hover:border-red-100 hover:text-[var(--color-primary)]"
              type="button"
            >
              <BellIcon className="h-3.5 w-3.5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </button>

            <div className="hidden items-center gap-2.5 rounded-[14px] border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.5)] sm:flex">
              <div
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-slate-950 text-[11px] font-semibold text-white ring-2 ring-red-100"
              >
                {getInitials(profileName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{profileName}</p>
                <p className="truncate text-[11px] text-slate-500">{profileEmail}</p>
              </div>
            </div>

            <Link
              aria-label={`Profil ${profileName}`}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[13px] border border-slate-200/80 bg-white text-[11px] font-semibold text-slate-700 transition hover:border-red-100 hover:text-[var(--color-primary)] sm:hidden"
              to="/profile"
            >
              {getInitials(profileName)}
            </Link>

            <button
              aria-label="Keluar"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[13px] border border-slate-200/80 bg-white text-slate-500 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.5)] transition hover:border-red-100 hover:text-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-red-100"
              onClick={() => setIsLogoutDialogOpen(true)}
              type="button"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto w-full px-2.5 py-3 sm:px-3.5 lg:px-4 lg:py-3.5",
          fullWidth ? "max-w-none" : "max-w-[1480px]"
        )}
      >
        {children}
      </main>

      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, Keluar"
        description="Apakah Anda yakin ingin keluar dari aplikasi Akara LMS?"
        isLoading={isSigningOut}
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => void handleLogoutConfirm()}
        open={isLogoutDialogOpen}
        title="Konfirmasi keluar"
      />
    </div>
  );
}
