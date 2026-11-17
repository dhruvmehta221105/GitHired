import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import API from "../api";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/useAuth";
import { getAvatarUrl } from "../utils/avatarUrl";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const DEFAULT_AVATARS = {
  female: "https://assets.watermelon.sh/wm_emma.png",
  default: "https://assets.watermelon.sh/wm_josh.png",
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export default function Settings() {
  const { user: authUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(authUser || {});
  const [name, setName] = useState(authUser?.name || "");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    API.get("/profile")
      .then(({ data }) => {
        if (!active) return;
        setProfile(data);
        setName(data.name || "");
        setAvatarUrl(/^https?:\/\//i.test(data.avatar || "") ? data.avatar : "");
        updateUser(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, "We could not load your latest account details."));
        }
      });

    return () => {
      active = false;
    };
  }, [updateUser]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  const profileAvatar = profile.avatar
    ? getAvatarUrl(profile.avatar)
    : (profile.gender?.toLowerCase() === "female" ? DEFAULT_AVATARS.female : DEFAULT_AVATARS.default);
  const displayedAvatar = avatarPreview || (!avatarFailed ? profileAvatar : "");

  const updateSavedProfile = (updatedProfile) => {
    setProfile(updatedProfile);
    updateUser(updatedProfile);
    setAvatarFailed(false);
  };

  const saveName = async (event) => {
    event.preventDefault();
    setBusy("name");
    setError("");
    setNotice("");
    try {
      const { data } = await API.patch("/profile", { name: name.trim() });
      updateSavedProfile(data);
      setName(data.name);
      setNotice("Your name has been updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not update your name."));
    } finally {
      setBusy("");
    }
  };

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setError("");
    setNotice("");
    if (!file) return;
    setSelectedAvatar(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Avatar images must be 5 MB or smaller.");
      return;
    }
    setSelectedAvatar(file);
  };

  const uploadAvatar = async () => {
    if (!selectedAvatar) return;
    setBusy("avatar");
    setError("");
    setNotice("");
    const formData = new FormData();
    formData.append("avatar", selectedAvatar);
    try {
      const { data } = await API.patch("/profile/avatar", formData);
      updateSavedProfile(data);
      setSelectedAvatar(null);
      setAvatarUrl("");
      setNotice("Your avatar has been updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not upload your avatar."));
    } finally {
      setBusy("");
    }
  };

  const saveAvatarUrl = async (event) => {
    event.preventDefault();
    setBusy("avatar-url");
    setError("");
    setNotice("");
    try {
      const { data } = await API.patch("/profile", { avatarUrl: avatarUrl.trim() });
      updateSavedProfile(data);
      setSelectedAvatar(null);
      setNotice(avatarUrl.trim() ? "Your avatar URL has been updated." : "Your custom avatar has been removed.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Enter a valid HTTP or HTTPS image URL."));
    } finally {
      setBusy("");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy("password");
    try {
      const { data } = await API.patch("/profile/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(data.message || "Your password has been updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not change your password."));
    } finally {
      setBusy("");
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (deleteConfirmation !== "DELETE") {
      setError('Type "DELETE" exactly to confirm account deletion.');
      return;
    }
    setBusy("delete");
    setError("");
    setNotice("");
    try {
      await API.delete("/profile", {
        data: { currentPassword: deletePassword, confirmation: deleteConfirmation },
      });
      logout();
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We could not delete your account."));
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-[960px] px-5 pb-16 pt-28 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[1.7px] text-accent">Account</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text">Settings</h1>
          <p className="mt-2 text-sm text-text-secondary">Manage your profile, sign-in security, and account.</p>
        </div>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error ? <AlertTriangle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
            {error || notice}
          </div>
        )}

        <section className="mb-5 rounded-2xl border border-border bg-bg-card p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-accent" />
            <div>
              <h2 className="font-bold text-text">Profile</h2>
              <p className="text-sm text-text-secondary">Update how your account appears.</p>
            </div>
          </div>

          <div className="mb-7 flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-accent-light text-2xl font-bold text-accent">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt="Profile avatar preview"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                (profile.name || "U").slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text transition hover:bg-bg-secondary">
                <ImagePlus size={16} />
                Choose image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={chooseAvatar}
                  className="sr-only"
                />
              </label>
              <p className="mt-2 text-xs text-text-secondary">JPEG, PNG, or WEBP · max 5 MB</p>
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={uploadAvatar}
                  disabled={busy === "avatar"}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {busy === "avatar" && <LoaderCircle size={15} className="animate-spin" />}
                  Upload avatar
                </button>
              )}
            </div>
          </div>

          <form onSubmit={saveName} className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-text">
              Username / display name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy === "name" || !name.trim()}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {busy === "name" ? "Saving…" : "Save name"}
            </button>
          </form>

          <form onSubmit={saveAvatarUrl} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-text">
              Avatar image URL
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/avatar.png"
                maxLength={2048}
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy === "avatar-url"}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-bg-secondary disabled:opacity-60"
            >
              {busy === "avatar-url" ? "Saving…" : "Save URL"}
            </button>
          </form>
        </section>

        <section className="mb-5 rounded-2xl border border-border bg-bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-accent" />
            <div>
              <h2 className="font-bold text-text">Sign-in and security</h2>
              <p className="text-sm text-text-secondary">Change your password to keep your account secure.</p>
            </div>
          </div>
          <label className="mb-4 block text-sm font-semibold text-text">
            Email address
            <input
              value={profile.email || ""}
              readOnly
              className="mt-2 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 font-normal text-text-secondary"
            />
            <span className="mt-1 block text-xs font-normal text-text-secondary">Email changes are not available in settings yet.</span>
          </label>
          <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-text sm:col-span-2">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm font-semibold text-text">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm font-semibold text-text">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy === "password"}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
              >
                {busy === "password" ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Change password
              </button>
            </div>
          </form>
        </section>

        <section className="mb-5 rounded-2xl border border-border bg-bg-card p-5 sm:p-7">
          <div className="mb-3 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-text">Subscription</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Billing is not connected to this account yet, so there is no subscription to manage or cancel here.
          </p>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary opacity-60"
          >
            Cancel subscription unavailable
          </button>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-7">
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="font-bold text-red-700">Delete account</h2>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-text-secondary">
            Permanently delete your account, interviews, chat history, and associated feedback. This cannot be undone.
          </p>
          <form onSubmit={deleteAccount} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-text">
              Current password
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-red-400"
              />
            </label>
            <label className="text-sm font-semibold text-text">
              Type DELETE to confirm
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
                required
                className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal outline-none focus:border-red-400"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy === "delete" || deleteConfirmation !== "DELETE"}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "delete" ? "Deleting account…" : "Permanently delete account"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
