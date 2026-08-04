/**
 * Route prop types, declared explicitly rather than using Next's generated
 * `PageProps`/`LayoutProps` globals.
 *
 * Those globals only exist after `.next/types` has been written, which would
 * make `pnpm typecheck` fail on a fresh clone or in CI before a build has run.
 * These are equivalent and always available.
 */

export type RouteParams<T extends Record<string, string> = Record<string, never>> = {
  params: Promise<T>;
};

export type SearchParams = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Convenience for the `[slug]` detail routes. */
export type SlugPageProps = RouteParams<{ slug: string }>;
