"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  anonymousViewerShellState,
  buildViewerShellState,
  type ViewerShellState
} from "@/lib/viewer-shell";

const ViewerShellContext = createContext<ViewerShellState>(anonymousViewerShellState);

type ViewerShellProviderProps = {
  children: React.ReactNode;
};

export function ViewerShellProvider({ children }: ViewerShellProviderProps) {
  const [state, setState] = useState<ViewerShellState>(anonymousViewerShellState);

  useEffect(() => {
    let active = true;

    async function loadViewerState() {
      try {
        const response = await fetch("/api/viewer-state", {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as Partial<ViewerShellState>;

        if (!active) {
          return;
        }

        setState(buildViewerShellState(payload));
      } catch {
        // Keep the anonymous fallback if the state request fails.
      }
    }

    void loadViewerState();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <ViewerShellContext.Provider value={value}>
      {children}
    </ViewerShellContext.Provider>
  );
}

export function useViewerShellState() {
  return useContext(ViewerShellContext);
}
