/**
 * Serial / unit tracking is driven only by Item Master "Serialized" flag —
 * not by itemType (asset vs consumable). Non-serialized assets behave like
 * quantity lines (consumable-style).
 */
export function itemNeedsSerial(
  item?: { isSerialized?: unknown; itemType?: unknown } | null,
): boolean {
  return Boolean(item?.isSerialized)
}
