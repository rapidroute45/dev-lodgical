import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { formatRoleLabel, formatStatusLabel } from "@/modules/users/utils/editableRoles.js";
import {
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/modules/auth/infrastructure/api/auth.queries.js";
import { LanguageSelector } from "@/shared/i18n/LanguageSelector.jsx";

function userStatusBadgeClass(status) {
  switch (status) {
    case "active":
      return "ops-badge ops-badge--done";
    case "pending":
      return "ops-badge ops-badge--pending";
    case "suspended":
      return "ops-badge ops-badge--rose";
    default:
      return "ops-badge ops-badge--muted";
  }
}

function formatTimestamp(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resolveAssignedCities(profile) {
  if (profile?.assignedCities?.length) return profile.assignedCities.filter(Boolean);
  if (profile?.assignedCity) return [profile.assignedCity];
  return [];
}

function ProfileField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </span>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="ops-meta-row">
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { data: me, refetch, isFetching, isLoading } = useMeQuery(Boolean(user));
  const updateProfile = useUpdateProfileMutation();
  const changePassword = useChangePasswordMutation();
  const profile = me ?? user;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
  }, [profile]);

  const displayName = profile?.displayName ?? resolveDisplayName(profile?.fullName, profile?.email);
  const initials = (displayName || "?").charAt(0).toUpperCase();
  const cities = useMemo(() => resolveAssignedCities(profile), [profile]);
  const roleLabel = profile?.role ? formatRoleLabel(profile.role) : t("profile.unassigned");
  const statusLabel = profile?.status ? formatStatusLabel(profile.status) : "—";
  const teamLabel = profile?.team
    ? `${profile.team.name}${profile.team.code ? ` (${profile.team.code})` : ""}`
    : "—";

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim() || null,
        phone: phone.trim() || null,
      });
      await refetch();
      setProfileMessage(t("profile.profileUpdated"));
    } catch (err) {
      setProfileError(err.message || t("common.save"));
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError(t("profile.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    try {
      const message = await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(message || t("profile.passwordUpdated"));
    } catch (err) {
      setPasswordError(err.message || t("profile.updatePassword"));
    }
  }

  if (isLoading && !profile) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={`${PAGE_CONTENT} space-y-4`}>
          <div className="ops-skel h-10 w-64 rounded-xl" />
          <div className="ops-skel h-36 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ops-skel h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} space-y-6`}>
        <div className="ops-fade">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {t("profile.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("profile.subtitle")}
          </p>
        </div>

        <section className="ops-profile-hero ops-panel ops-fade overflow-hidden">
          <div className="ops-profile-hero__glow" aria-hidden="true" />
          <div className="relative flex flex-wrap items-center gap-5 p-6 sm:p-8">
            <span className="ops-profile-hero__avatar">{initials}</span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {displayName}
              </h2>
              <p className="mt-1 truncate text-sm" style={{ color: "var(--text-muted)" }}>
                {profile?.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="ops-badge ops-badge--active">{roleLabel}</span>
                <span className={userStatusBadgeClass(profile?.status)}>{statusLabel}</span>
                {profile?.pendingRoleAssignment ? (
                  <span className="ops-badge ops-badge--pending">{t("profile.awaitingRole")}</span>
                ) : null}
              </div>
            </div>
            <div className="text-right text-xs" style={{ color: "var(--text-dim)" }}>
              <p>User ID</p>
              <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                {profile?.id ?? "—"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OpsStatCard icon="check" label={t("profile.accountStatus")} value={statusLabel} delay={0} />
          <OpsStatCard icon="drivers" label={t("profile.role")} value={roleLabel} barColor="var(--accent-2)" delay={60} />
          <OpsStatCard icon="routes" label={t("profile.team")} value={profile?.team?.name ?? "—"} delay={120} />
          <OpsStatCard
            icon="clock"
            label={t("profile.memberSince")}
            value={formatTimestamp(profile?.createdAt)}
            delay={180}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {t("profile.personalInfo")}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("profile.personalInfoHint")}
                </p>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4 p-5">
                <ProfileField label={t("profile.fullName")}>
                  <input
                    className="ops-field w-full text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </ProfileField>
                <ProfileField label={t("profile.phone")} hint={t("profile.phoneHint")}>
                  <input
                    className="ops-field w-full text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                  />
                </ProfileField>
                <ProfileField label={t("profile.email")} hint={t("profile.emailHint")}>
                  <input
                    className="ops-field w-full text-sm opacity-70"
                    value={profile?.email ?? ""}
                    readOnly
                    disabled
                  />
                </ProfileField>

                {profileMessage ? (
                  <div className="ops-banner ops-banner--success">{profileMessage}</div>
                ) : null}
                {profileError ? (
                  <div className="ops-banner ops-banner--error">{profileError}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="ops-btn ops-btn--accent px-6 py-2.5 font-bold disabled:opacity-60"
                >
                  {updateProfile.isPending ? t("common.saving") : t("profile.saveProfile")}
                </button>
              </form>
            </section>

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {t("profile.security")}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("profile.securityHint")}
                </p>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4 p-5">
                <ProfileField label={t("profile.currentPassword")}>
                  <input
                    type="password"
                    className="ops-field w-full text-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </ProfileField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label={t("profile.newPassword")} hint={t("profile.newPasswordHint")}>
                    <input
                      type="password"
                      className="ops-field w-full text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </ProfileField>
                  <ProfileField label={t("profile.confirmPassword")}>
                    <input
                      type="password"
                      className="ops-field w-full text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </ProfileField>
                </div>

                {passwordMessage ? (
                  <div className="ops-banner ops-banner--success">{passwordMessage}</div>
                ) : null}
                {passwordError ? (
                  <div className="ops-banner ops-banner--error">{passwordError}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="ops-btn px-6 py-2.5 font-semibold disabled:opacity-60"
                >
                  {changePassword.isPending ? t("common.updating") : t("profile.updatePassword")}
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <LanguageSelector />

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {t("profile.accountDetails")}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("profile.accountDetailsHint")}
                </p>
              </div>
              <dl className="ops-meta-grid px-5 pb-2">
                <MetaRow label={t("profile.role")} value={roleLabel} />
                <MetaRow label={t("profile.status")} value={statusLabel} />
                <MetaRow label={t("profile.team")} value={teamLabel} />
                <MetaRow label={t("profile.memberSince")} value={formatTimestamp(profile?.createdAt)} />
                <MetaRow label={t("profile.lastUpdated")} value={formatTimestamp(profile?.updatedAt)} />
              </dl>
            </section>

            {cities.length > 0 ? (
              <section className="ops-panel ops-fade overflow-hidden">
                <div className="ops-panel__head px-5 py-4">
                  <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                    {t("profile.assignedCities")}
                  </h3>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("profile.assignedCitiesHint")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 p-5">
                  {cities.map((city) => (
                    <span key={city} className="ops-chip ops-chip--active">
                      {city}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {t("profile.session")}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("profile.sessionHint")}
                </p>
              </div>
              <div className="p-5">
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="ops-btn w-full justify-center px-4 py-2.5 text-sm font-semibold"
                  style={{
                    color: "var(--rose)",
                    borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)",
                    background: "color-mix(in srgb, var(--rose) 6%, transparent)",
                  }}
                >
                  {t("common.signOut")}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
