export type PortalRole = "mahasiswa" | "dosen";

export type PortalSessionUser = {
  id: string;
  name: string;
  email: string;
  roles: PortalRole[];
  activeRole: PortalRole;
  redirectTo: string;
};

export const roleLabels: Record<PortalRole, string> = {
  mahasiswa: "Mahasiswa",
  dosen: "Dosen",
};

export function getDefaultRedirect(role: PortalRole) {
  return role === "dosen" ? "/dosen/dashboard" : "/mahasiswa/dashboard";
}

export function canAccessRole(user: PortalSessionUser, role: PortalRole) {
  return user.roles.includes(role);
}

export function resolveInitialRedirect(user: PortalSessionUser) {
  if (user.roles.length > 1) {
    return "/pilih-peran";
  }

  return user.redirectTo || getDefaultRedirect(user.activeRole);
}
