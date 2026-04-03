export type ViewerPhase =
  | "anonymous"
  | "signed_in_empty"
  | "signed_in_role_only"
  | "signed_in_connected";

export type ViewerShellState = {
  phase: ViewerPhase;
  authenticated: boolean;
  hasRole: boolean;
  hasThread: boolean;
  hasBindings: boolean;
  nextStepHref: string | null;
  nextStepTitle: string | null;
};

export type ViewerRouteIntent =
  | "memory"
  | "memory_action"
  | "im_chat"
  | "im_action"
  | "privacy"
  | "privacy_action"
  | "primary_flow"
  | "create_companion"
  | "create_girlfriend"
  | "create_boyfriend"
  | "dashboard";

export const anonymousViewerShellState: ViewerShellState = {
  phase: "anonymous",
  authenticated: false,
  hasRole: false,
  hasThread: false,
  hasBindings: false,
  nextStepHref: null,
  nextStepTitle: null
};

export function resolveViewerPhase(args: {
  authenticated: boolean;
  hasRole: boolean;
  hasThread: boolean;
  hasBindings: boolean;
}): ViewerPhase {
  if (!args.authenticated) {
    return "anonymous";
  }

  if (!args.hasRole || !args.hasThread) {
    return "signed_in_empty";
  }

  if (!args.hasBindings) {
    return "signed_in_role_only";
  }

  return "signed_in_connected";
}

export function buildViewerShellState(
  input: Partial<Omit<ViewerShellState, "phase">>
): ViewerShellState {
  const authenticated = input.authenticated ?? false;
  const hasRole = input.hasRole ?? false;
  const hasThread = input.hasThread ?? false;
  const hasBindings = input.hasBindings ?? false;

  return {
    authenticated,
    hasRole,
    hasThread,
    hasBindings,
    nextStepHref: input.nextStepHref ?? null,
    nextStepTitle: input.nextStepTitle ?? null,
    phase: resolveViewerPhase({
      authenticated,
      hasRole,
      hasThread,
      hasBindings
    })
  };
}

export function resolveViewerRoute(
  intent: ViewerRouteIntent,
  state: ViewerShellState
) {
  switch (intent) {
    case "memory":
      if (!state.authenticated) {
        return "/features/memory-center";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return "/app/role";

    case "memory_action":
      if (!state.authenticated) {
        return "/create";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return "/app/role";

    case "im_chat":
      if (!state.authenticated) {
        return "/features/im-chat";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return state.hasBindings ? "/app/chat" : "/connect-im";

    case "im_action":
      if (!state.authenticated) {
        return "/create";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return state.hasBindings ? "/app/chat" : "/connect-im";

    case "privacy":
      if (!state.authenticated) {
        return "/features/privacy-controls";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return "/app/role";

    case "privacy_action":
      if (!state.authenticated) {
        return "/create";
      }

      if (!state.hasRole || !state.hasThread) {
        return "/create";
      }

      return "/app/role";

    case "primary_flow":
      if (!state.authenticated || (!state.hasRole || !state.hasThread)) {
        return "/";
      }

      return state.nextStepHref ?? "/app";

    case "create_companion":
      if (state.authenticated && state.hasRole && state.hasThread) {
        return state.nextStepHref ?? "/app";
      }

      return "/";

    case "create_girlfriend":
      if (state.authenticated && state.hasRole && state.hasThread) {
        return state.nextStepHref ?? "/app";
      }

      return "/?preset=caria";

    case "create_boyfriend":
      if (state.authenticated && state.hasRole && state.hasThread) {
        return state.nextStepHref ?? "/app";
      }

      return "/?preset=teven";

    case "dashboard":
      return state.authenticated ? "/app" : "/login";

    default:
      return "/";
  }
}
