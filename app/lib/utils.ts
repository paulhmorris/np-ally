import { Contact } from "@prisma/client";
import { useMatches } from "@remix-run/react";
import { rankItem } from "@tanstack/match-sorter-utils";
import { FilterFn } from "@tanstack/react-table";
import clsx, { ClassValue } from "clsx";
import { useMemo } from "react";
import { useTypedRouteLoaderData } from "remix-typedjson";
import { twMerge } from "tailwind-merge";

import { loader as rootLoder } from "~/root";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(id: string): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(() => matchingRoutes.find((route) => route.id === id), [matchingRoutes, id]);
  return route?.data as Record<string, unknown>;
}

export function useOptionalUser() {
  const data = useTypedRouteLoaderData<typeof rootLoder>("root");
  if (!data) {
    return undefined;
  }
  return data.user;
}

export function useUser() {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export const isBrowser = typeof document !== "undefined" && typeof process === "undefined";

export function normalizeEnum(value: string) {
  const wordsToKeepLowercase = ["a", "an", "the", "and", "but", "or", "for", "of"];

  return value
    .split(/[_\s]+/)
    .map((word, index) => {
      if (index === 0 || !wordsToKeepLowercase.includes(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");
}

export function getSearchParam(param: string, request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get(param);
}
export function getAllSearchParams(param: string, request: Request) {
  const url = new URL(request.url);
  return url.searchParams.getAll(param);
}

export function formatCurrency(value: number, decimals?: 0 | 2) {
  const decimalPlaces = decimals ? decimals : value % 1 !== 0 ? 2 : 0;
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);

  return formattedValue;
}

export function formatCentsAsDollars(value: number | null | undefined, decimals: 0 | 2 = 2) {
  if (!value) {
    return formatCurrency(0, decimals);
  }
  return formatCurrency(value / 100, decimals);
}

export function formatPhoneNumber(value: string) {
  const cleaned = `${value}`.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return null;
}

export function getToday() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

export function getInitials(contact: Contact) {
  return `${contact.firstName?.charAt(0)}${contact.lastName?.charAt(0)}`;
}

export function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value);
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
