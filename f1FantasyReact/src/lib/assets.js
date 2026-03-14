import { API_BASE_URL, buildApiUrl } from "./api";

const svgPlaceholder = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
    <rect width="320" height="180" fill="#e5e7eb" />
    <rect x="20" y="20" width="280" height="140" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    <text x="160" y="96" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">No image</text>
  </svg>`
);

export const EMPTY_IMAGE = `data:image/svg+xml;charset=UTF-8,${svgPlaceholder}`;

const normalizeImagePath = (value) => {
  if (!value) {
    return "";
  }

  let normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    try {
      const parsed = new URL(normalizedValue);
      const isLocalHost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      if (isLocalHost) {
        normalizedValue = parsed.pathname;
      } else {
        return normalizedValue;
      }
    } catch {
      return normalizedValue;
    }
  }

  normalizedValue = normalizedValue
    .replace(/^public\//i, "/")
    .replace(/^images\//i, "/images/")
    .replace(/^\/public\/images\//i, "/images/")
    .replace(/^\/images\/teams\//i, "/images/Teams/")
    .replace(/^\/images\/leagues\//i, "/images/Leagues/")
    .replace(/^\/images\/drivers\//i, "/images/drivers/");

  if (!normalizedValue.startsWith("/")) {
    normalizedValue = `/${normalizedValue}`;
  }

  return normalizedValue;
};

export const resolveAssetUrl = (value) => {
  if (!value) {
    return EMPTY_IMAGE;
  }

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  const normalizedPath = normalizeImagePath(value);

  if (!normalizedPath) {
    return EMPTY_IMAGE;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/images/")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return buildApiUrl(normalizedPath);
};
