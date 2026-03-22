import type {
  BindingLookup,
  BindingLookupInput,
  BindingLookupResult,
  BindingRepository,
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

export class InMemoryBindingRepository implements BindingRepository {
  constructor(private readonly bindings: ChannelBinding[]) {}

  async findActiveBinding(input: BindingLookupInput): Promise<ChannelBinding | null> {
    return (
      this.bindings.find((candidate) => matchesBinding(candidate, input)) ?? null
    );
  }
}

export function createBindingLookupFromRepository(
  repository: BindingRepository
): BindingLookup {
  return {
    async lookup(input: BindingLookupInput): Promise<BindingLookupResult> {
      const binding = await repository.findActiveBinding(input);

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
  };
}
