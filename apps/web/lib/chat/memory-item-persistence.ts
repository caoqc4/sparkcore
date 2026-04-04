export function insertMemoryItem(args: {
  supabase: any;
  payload: Record<string, unknown>;
}) {
  return args.supabase.from("memory_items").insert(args.payload);
}

export function insertMemoryItems(args: {
  supabase: any;
  rows: Array<Record<string, unknown>>;
}) {
  return args.supabase.from("memory_items").insert(args.rows);
}

export function updateMemoryItem(args: {
  supabase: any;
  memoryItemId: string;
  patch: Record<string, unknown>;
}) {
  return args.supabase
    .from("memory_items")
    .update(args.patch)
    .eq("id", args.memoryItemId);
}

export function updateMemoryItems(args: {
  supabase: any;
  memoryItemIds: string[];
  patch: Record<string, unknown>;
}) {
  if (args.memoryItemIds.length === 0) {
    return Promise.resolve({ data: null, error: null });
  }

  return args.supabase
    .from("memory_items")
    .update(args.patch)
    .in("id", args.memoryItemIds);
}

export function deleteOwnedMemoryItems(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase.from("memory_items").delete().eq("user_id", args.userId);
}
