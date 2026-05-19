/**
 * Avatar data — shared across all apps that render user / library avatars.
 *
 * Discriminated union; mirrors `packages/web/src/types/avatar.ts` in host.
 */
export type AvatarData =
  | { type: "text"; text: string; color: string }
  | { type: "icon"; icon: string; color: string }
  | { type: "image"; src: string };
