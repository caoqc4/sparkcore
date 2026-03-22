import type {
  BindingLookup,
  BindingLookupInput,
  BindingLookupResult,
  ChannelBinding
} from "./contract";
import {
  createBindingLookupFromRepository,
  InMemoryBindingRepository
} from "./repository";

export class InMemoryBindingLookup implements BindingLookup {
  private readonly delegate: BindingLookup;

  constructor(bindings: ChannelBinding[]) {
    this.delegate = createBindingLookupFromRepository(
      new InMemoryBindingRepository(bindings)
    );
  }

  async lookup(input: BindingLookupInput): Promise<BindingLookupResult> {
    return this.delegate.lookup(input);
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
