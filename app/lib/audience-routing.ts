import type { NextRequest } from "next/server";
import type { Audience, PublicSurface } from "@/types/routing";

type HeaderSource = Pick<Headers, "get">;

export const INTERNAL_PREFIX_BY_AUDIENCE: Record<Audience, string> = {
  public: "",
  agent: "/agent",
  company: "/company",
  employee: "/employee",
};

export const AUDIENCE_SUBDOMAIN: Record<
  Exclude<Audience, "public">,
  string
> = {
  agent: "agent",
  company: "company",
  employee: "employee",
};

export const PUBLIC_SURFACE_PREFIX_BY_KIND: Record<PublicSurface, string> = {
  landing: "/",
  showcase: "/showcase",
  payslip: "/payslip/view",
};

const STATIC_FILE_PATTERN = /\.[a-z0-9]+$/i;

function sanitizeBaseUrl(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

function normalizeHost(host: string | null | undefined) {
  return host?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
}

export function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized !== "/" ? normalized.replace(/\/+$/, "") : normalized;
}

function hasGetMethod(value: unknown): value is HeaderSource {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    typeof (value as { get?: unknown }).get === "function"
  );
}

function getHeaderSource(source?: NextRequest | HeaderSource | null) {
  if (!source) return null;

  if (hasGetMethod(source)) {
    return source;
  }

  if (
    typeof source === "object" &&
    source !== null &&
    "headers" in source &&
    hasGetMethod(source.headers)
  ) {
    return source.headers;
  }

  return null;
}

export function getOriginFromHeaders(source?: NextRequest | HeaderSource | null) {
  const headers = getHeaderSource(source);
  if (!headers) return null;

  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost || headers.get("host");
  if (!host) return null;

  const forwardedProto = headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto || (isLocalDevelopmentHost(normalizeHost(host)) ? "http" : "https");
  return `${protocol}://${host}`;
}

export function isLocalDevelopmentHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

function resolveApexHost(hostname: string) {
  if (!hostname) return hostname;
  if (isLocalDevelopmentHost(hostname)) return hostname;

  const parts = hostname.split(".");
  if (
    parts.length > 2 &&
    Object.values(AUDIENCE_SUBDOMAIN).includes(parts[0] as "agent" | "company" | "employee")
  ) {
    return parts.slice(1).join(".");
  }

  return hostname;
}

function getConfiguredBaseUrl(audience: Audience) {
  const envByAudience: Record<Audience, string | null | undefined> = {
    public:
      process.env.PUBLIC_BASE_URL ||
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL,
    agent: process.env.AGENT_BASE_URL,
    company: process.env.COMPANY_BASE_URL,
    employee: process.env.EMPLOYEE_BASE_URL,
  };

  return sanitizeBaseUrl(envByAudience[audience]);
}

export function resolveAudienceFromHost(host: string | null | undefined): Audience {
  const hostname = normalizeHost(host);
  if (!hostname) return "public";

  if (hostname.startsWith("agent.")) return "agent";
  if (hostname.startsWith("company.")) return "company";
  if (hostname.startsWith("employee.")) return "employee";

  return "public";
}

export function toExternalPath(audience: Audience, internalPath: string) {
  const normalized = normalizePathname(internalPath);
  if (audience === "public") return normalized;

  const prefix = INTERNAL_PREFIX_BY_AUDIENCE[audience];
  if (normalized === prefix) return "/";
  if (normalized.startsWith(`${prefix}/`)) {
    return normalized.slice(prefix.length) || "/";
  }
  return normalized;
}

export function toInternalPath(audience: Audience, externalPath: string) {
  const normalized = normalizePathname(externalPath);
  if (audience === "public") return normalized;

  const prefix = INTERNAL_PREFIX_BY_AUDIENCE[audience];
  if (normalized === "/") return prefix;
  if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
    return normalized;
  }
  return `${prefix}${normalized}`;
}

export function getBaseUrlForAudience(
  audience: Audience,
  source?: NextRequest | HeaderSource | null,
) {
  const origin =
    sanitizeBaseUrl(getOriginFromHeaders(source)) || "http://localhost:3000";
  const url = new URL(origin);
  const hostname = normalizeHost(url.hostname);

  if (isLocalDevelopmentHost(hostname)) {
    if (audience === "public") {
      return url.origin;
    }

    return `${url.origin}${INTERNAL_PREFIX_BY_AUDIENCE[audience]}`;
  }

  const configured = getConfiguredBaseUrl(audience);
  if (configured) return configured;

  const apexHost = resolveApexHost(hostname);
  if (audience === "public") {
    url.hostname = apexHost;
    return url.origin;
  }

  url.hostname = `${AUDIENCE_SUBDOMAIN[audience]}.${apexHost}`;
  return url.origin;
}

export function buildUrlForAudience(
  audience: Audience,
  internalPath: string,
  source?: NextRequest | HeaderSource | null,
  searchParams?: Record<string, string | number | boolean | null | undefined>,
) {
  const baseUrl = getBaseUrlForAudience(audience, source);
  const externalPath =
    audience === "public"
      ? normalizePathname(internalPath)
      : toExternalPath(audience, internalPath);
  const url = new URL(`${baseUrl}${externalPath}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === null || value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function buildShowcaseUrl(
  slug: string,
  source?: NextRequest | HeaderSource | null,
) {
  return buildUrlForAudience("public", `/showcase/${slug}`, source);
}

export function isPublicSurfacePath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return (
    normalized === PUBLIC_SURFACE_PREFIX_BY_KIND.showcase ||
    normalized.startsWith(`${PUBLIC_SURFACE_PREFIX_BY_KIND.showcase}/`) ||
    normalized === PUBLIC_SURFACE_PREFIX_BY_KIND.payslip ||
    normalized.startsWith(`${PUBLIC_SURFACE_PREFIX_BY_KIND.payslip}/`)
  );
}

export function isStaticAssetPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return (
    normalized.startsWith("/_next") ||
    normalized.startsWith("/images") ||
    normalized.startsWith("/fonts") ||
    normalized === "/favicon.ico" ||
    normalized === "/robots.txt" ||
    normalized === "/sitemap.xml" ||
    STATIC_FILE_PATTERN.test(normalized)
  );
}
