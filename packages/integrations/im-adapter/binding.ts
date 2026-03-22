import type {
  BindingLookup,
  BindingLookupInput,
  BindingLookupResult,
  ChannelBinding
} from "./contract";

function matchesBinding(binding: ChannelBinding, input: BindingLookupInput) {
  return (
    binding.platform === input.platform &&
    binding.channel_id === input.channel_id &&
    binding.peer_id === input.peer_id &&
    binding.platform_user_id === input.platform_user_id &&
    binding.status === "active"
  );
}

export class InMemoryBindingLookup implements BindingLookup {
  constructor(private readonly bindings: ChannelBinding[]) {}

  async lookup(input: BindingLookupInput): Promise<BindingLookupResult> {
    const binding = this.bindings.find((candidate) =>
      matchesBinding(candidate, input)
    );

    if (!binding) {
      return {
        status: "not_found",
        reason: "no active binding matched the inbound identity"
      };
    }

    return {
      status: "found",
      binding
    };
  }
}

export function buildBindingLookupInput(args: {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
}): BindingLookupInput {
  return {
    platform: args.platform,
    channel_id: args.channel_id,
    peer_id: args.peer_id,
    platform_user_id: args.platform_user_id
  };
}
