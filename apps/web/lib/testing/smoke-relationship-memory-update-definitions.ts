export function buildSmokeRelationshipMemoryUpdateDefinitions(args: {
  smokeNickname: string | null;
  smokePreferredName: string | null;
  smokeUserAddressStyle: string | null;
}) {
  return [
    {
      key: "agent_nickname" as const,
      value: args.smokeNickname,
      confidence: 0.96,
      stability: "high" as const,
      errorLabel: "nickname"
    },
    {
      key: "user_preferred_name" as const,
      value: args.smokePreferredName,
      confidence: 0.94,
      stability: "high" as const,
      errorLabel: "preferred-name"
    },
    {
      key: "user_address_style" as const,
      value: args.smokeUserAddressStyle,
      confidence: 0.9,
      stability: "medium" as const,
      errorLabel: "address-style"
    }
  ];
}
