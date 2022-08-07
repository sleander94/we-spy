import { Timestamp } from 'firebase/firestore/lite';
import { ChangeEvent, MutableRefObject } from 'react';

// Custom Objects

export type Puzzle = {
  id: string;
  author: string;
  authorId: string;
  title: string;
  timestamp: Timestamp;
  image: string;
  hiddenItems: Array<HiddenItem>;
  likes: Array<string>;
  views: number;
};

export type PuzzleData = {
  title: string;
  image: string;
};

export type HiddenItem = {
  description: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type LeaderboardData = {
  author: string;
  title: string;
  image: string;
  timestamp: Timestamp;
  scores: Array<Score>;
};

export type Score = {
  user: string;
  time: number;
  id: string;
};

// Component Props

export type UserProps = {
  loggedIn: boolean;
  username: string;
  userId: string;
};

export type FormProps = {
  loggedIn: boolean;
  username: string;
  userId: string;
};

export type UploaderProps = {
  username: string;
  timer: number;
};

export type PuzzleCardProps = {
  title: string;
  id: string;
  author: string;
  image: string;
  timestamp: Timestamp;
  likes: Array<string>;
  views: number;
};

export type LeaderboardProps = {
  scores: Array<Score>;
};

export type ImageSelectorProps = {
  handleChange: Function;
  loadImage: (event: ChangeEvent<HTMLInputElement>) => void;
  validateTitleForm: Function;
  error: string;
  imageLoaded: boolean;
  imageSrc: string;
};

export type SelectorProps = {
  x: number;
  y: number;
  hiddenItems: Array<HiddenItem>;
  handleGuess: Function;
};

export type SelectionCanvasProps = {
  width: number;
  height: number;
  currDescription: string;
  updateCoords: Function;
  filterItems: Function;
};
