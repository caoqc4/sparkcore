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
