export interface MenuBarMenuItem {
  key: string;
  label: string;
  icon?: unknown;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface MenuBarMenuDivider {
  type: "divider";
}

export type MenuBarMenuEntry = MenuBarMenuItem | MenuBarMenuDivider;

export interface MenuBarMenu {
  key: string;
  label: string;
  items: MenuBarMenuEntry[];
}

export interface MenuBarSearchConfig {
  appId: string;
  searchType: "movie" | "tv" | "book" | "photo" | "music";
  placeholder?: string;
  onSelect: (item: {
    id: string;
    title: string;
    [key: string]: unknown;
  }) => void;
  recentItems?: Array<{
    id: string;
    title: string;
    posterPath?: string | null;
    type?: string;
  }>;
}

export interface MenuBarConfig {
  menus?: MenuBarMenu[];
  search?: MenuBarSearchConfig;
  about?: { description?: string; version?: string };
  /**
   * Entries injected into the host-rendered [appName] dropdown.
   * Placed between the standard About item and the Quit item;
   * the host automatically adds a divider before this group when
   * About / App Settings / Preferences items precede it.
   *
   * Use this for app-scoped actions that conceptually belong to
   * the application itself rather than the active window — typically
   * app-level settings dialogs (e.g. download engine, API keys),
   * sign-out, or "about" sub-pages.
   */
  appMenu?: MenuBarMenuEntry[];
}
