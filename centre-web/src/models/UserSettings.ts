export type UserSettings = {
  id?: number;
  username: string;
  card_positions: Record<string, number>;
  settings: Record<string, any>;
};

