import type { ObjectId } from "../../../../state/ExperienceContext";

export interface StationDefinition {
  id: ObjectId;
  label: string;
  message: string;
  accent: string;
  position: readonly [number, number, number];
}

export const STATIONS: readonly StationDefinition[] = [
  {
    id: "memories",
    label: "MEMORIES",
    message: "Your memories will live here.",
    accent: "#f2a43a",
    position: [-2.46, -0.73, 0.58],
  },
  {
    id: "letters",
    label: "LETTERS",
    message: "Your letters will unfold here.",
    accent: "#f3dfbc",
    position: [-0.82, -0.73, 0.58],
  },
  {
    id: "playlist",
    label: "PLAYLIST",
    message: "The songs that held your story will play here.",
    accent: "#dc7774",
    position: [0.82, -0.73, 0.58],
  },
  {
    id: "story",
    label: "OUR STORY",
    message: "Your story will be remembered here.",
    accent: "#9dbed0",
    position: [2.46, -0.73, 0.58],
  },
] as const;

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((station) => [station.id, station])) as Record<
  ObjectId,
  StationDefinition
>;
