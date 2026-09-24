"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";

/**
 * Keyed async resource hook.
 *
 * When the key changes, state is reset during render (the React-endorsed "adjust
 * state when an input changes" pattern); the effect only runs the fetch and
 * updates state from promise callbacks. Data fetching stays out of the render
 * path without triggering cascading renders or setState-in-effect.
 */
export interface ResourceState<T> {
  status: "loading" | "ready" | "error" | "skipped";
  data: T | null;
  error: ApiError | null;
}

const IDLE: ResourceState<never> = { status: "loading", data: null, error: null };

export function useAsyncResource<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: { skip?: boolean },
): ResourceState<T> {
  const skip = options?.skip ?? false;
  const [prevKey, setPrevKey] = useState(key);
  const [state, setState] = useState<ResourceState<T>>(IDLE as ResourceState<T>);

  if (prevKey !== key) {
    setPrevKey(key);
    setState({ status: skip ? "skipped" : "loading", data: null, error: null });
  } else if (skip && state.status !== "skipped") {
    setState({ status: "skipped", data: null, error: null });
  } else if (!skip && state.status === "skipped") {
    setState({ status: "loading", data: null, error: null });
  }

  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    let cancelled = false;

    fetcher(controller.signal).then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      },
      (error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          error:
            error instanceof ApiError
              ? error
              : new ApiError(
                  {
                    code: "unknown",
                    message: error instanceof Error ? error.message : "The request failed.",
                  },
                  0,
                ),
        });
      },
    );

    return () => {
      cancelled = true;
      controller.abort();
    };
    // `fetcher` is intentionally excluded — the key uniquely identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip]);

  return state;
}
