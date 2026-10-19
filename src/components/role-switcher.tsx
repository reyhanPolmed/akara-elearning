import { useNavigate } from "react-router-dom";

import { getDefaultRedirect, roleLabels } from "../lib/auth";
import { useAuth } from "../lib/auth-context";

export function RoleSwitcher() {
  const navigate = useNavigate();
  const { user, setActiveRole } = useAuth();

  if (!user || user.roles.length <= 1) {
    return null;
  }

  return (
    <label className="hidden items-center gap-1.5 text-[12px] font-semibold text-slate-600 sm:flex">
      Role
      <select
        value={user.activeRole}
        onChange={(event) => {
          const role = event.target.value as typeof user.activeRole;
          setActiveRole(role);
          navigate(getDefaultRedirect(role));
        }}
        className="h-9 cursor-pointer rounded-[14px] border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slate-950 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.4)] outline-none transition hover:border-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
      >
        {user.roles.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
    </label>
  );
}
