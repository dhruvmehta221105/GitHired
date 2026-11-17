const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return new URL(avatar, new URL(API_BASE_URL, window.location.origin).origin).toString();
};
