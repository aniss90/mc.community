import { useLocation, useParams } from '@remix-run/react';
import { computeRoute } from '../utils';

export const useRoute = (): { route: string | null; path: string } => {
  const params = useParams();
  const { pathname: path } = useLocation();
  return { route: computeRoute(path, params as never), path };
};

export function getBasePath(): string | undefined {
  // !! important !!
  // do not access env variables using import.meta.env[varname]
  // some bundles won't replace the value at build time.
  try {
    return import.meta.env.VITE_VERCEL_OBSERVABILITY_BASEPATH as
      | string
      | undefined;
  } catch {
    // do nothing
  }
}
