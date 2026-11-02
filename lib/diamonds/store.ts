import { generateInventory } from "./generate";
import type { Stone } from "./types";

/**
 * The stone inventory, built once per server process. To connect a real
 * supplier, replace generateInventory() with a fetch from their API and keep
 * returning Stone objects; the API routes and pages need no other changes.
 */
let inventory: Stone[] | null = null;
let byId: Map<string, Stone> | null = null;

export function getInventory() {
  if (!inventory) {
    inventory = generateInventory();
    byId = new Map(inventory.map((s) => [s.id, s]));
  }
  return inventory;
}

export function getStone(id: string) {
  getInventory();
  return byId!.get(id) ?? null;
}
