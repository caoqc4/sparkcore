export function buildAgentSourceMetadata(args: {
  sourceSlug: string;
  sourceDescription?: string | null;
  autoCreated?: boolean;
  createdFromChat?: boolean;
  isDefaultForWorkspace?: boolean;
  smokeSeed?: boolean;
}) {
  return {
    ...(args.autoCreated ? { auto_created: true } : {}),
    ...(args.createdFromChat ? { created_from_chat: true } : {}),
    ...(args.isDefaultForWorkspace ? { is_default_for_workspace: true } : {}),
    ...(args.smokeSeed ? { smoke_seed: true } : {}),
    source_slug: args.sourceSlug,
    ...(args.sourceDescription ? { source_description: args.sourceDescription } : {})
  };
}
