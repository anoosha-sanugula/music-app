export interface Album {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

export interface LibraryData {
  likedSongIds: string[];
  albums: Album[];
  version: number;
}
