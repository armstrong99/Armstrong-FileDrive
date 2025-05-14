export type FileNode = {
  name: string;
  type: "file";
  fileSize: number;
  file?: File;
  relativePath: string;
  id?: string;
};

export type FolderNode = {
  name: string;
  id?: string;
  type: "folder";
  children: { [key: string]: FolderNode | FileNode };
  totalSize: number;
  relativePath: string;
};

type Node = FileNode | FolderNode;

export const mockData: Node[] = [
  {
    name: "welcome.txt",
    type: "file",
    fileSize: 128,
    relativePath: "root/welcome.txt",
  },
  {
    name: "images",
    type: "folder",
    totalSize: 3072,
    relativePath: "root/images",
    children: {
      "logo.png": {
        name: "logo.png",
        type: "file",
        fileSize: 2048,
        relativePath: "root/images/logo.png",
      },
      "bg.jpg": {
        name: "bg.jpg",
        type: "file",
        fileSize: 1024,
        relativePath: "root/images/bg.jpg",
      },
    },
  },
  {
    name: "documents",
    type: "folder",
    totalSize: 25 * 6000, // 150_000
    relativePath: "root/documents",
    children: Array.from({ length: 25 }, (_, i) => {
      const name = `doc-${i + 1}.pdf`;
      return {
        name,
        type: "file" as const,
        fileSize: 6000,
        relativePath: `root/documents/${name}`,
      };
    }).reduce((acc, file) => {
      acc[file.name] = file;
      return acc;
    }, {} as Record<string, FileNode>),
  },
  {
    name: "videos",
    type: "folder",
    totalSize: 15 * 80_000 + 30 * 30_000, // 1_200_000 + 900_000 = 2_100_000
    relativePath: "root/videos",
    children: {
      trailers: {
        name: "trailers",
        type: "folder",
        totalSize: 15 * 80_000,
        relativePath: "root/videos/trailers",
        children: Array.from({ length: 15 }, (_, i) => {
          const name = `trailer-${i + 1}.mp4`;
          return {
            name,
            type: "file" as const,
            fileSize: 80_000,
            relativePath: `root/videos/trailers/${name}`,
          };
        }).reduce((acc, file) => {
          acc[file.name] = file;
          return acc;
        }, {} as Record<string, FileNode>),
      },
      clips: {
        name: "clips",
        type: "folder",
        totalSize: 30 * 30_000,
        relativePath: "root/videos/clips",
        children: Array.from({ length: 30 }, (_, i) => {
          const name = `clip-${i + 1}.mp4`;
          return {
            name,
            type: "file" as const,
            fileSize: 30_000,
            relativePath: `root/videos/clips/${name}`,
          };
        }).reduce((acc, file) => {
          acc[file.name] = file;
          return acc;
        }, {} as Record<string, FileNode>),
      },
    },
  },
  {
    name: "music",
    type: "folder",
    totalSize: 20 * 125_000, // 2_500_000
    relativePath: "root/music",
    children: Array.from({ length: 20 }, (_, i) => {
      const name = `song-${i + 1}.mp3`;
      return {
        name,
        type: "file" as const,
        fileSize: 125_000,
        relativePath: `root/music/${name}`,
      };
    }).reduce((acc, file) => {
      acc[file.name] = file;
      return acc;
    }, {} as Record<string, FileNode>),
  },
];

export function buildFolderTree(
  files: File[]
): [FolderNode, File[], string[]] | null {
  if (files.length === 0) return null;
  const filesBuffer: File[] = [];
  const filesRelativePath: string[] = [];

  const rootName = files[0].webkitRelativePath.split("/")[0];
  const root: FolderNode = {
    name: rootName,
    type: "folder",
    children: {},
    totalSize: 0,
    relativePath: rootName,
  };

  files.forEach((file) => {
    const parts = file.webkitRelativePath.split("/");
    let currFolder = root;
    const ancestors: FolderNode[] = [root];
    let pathSoFar = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        const fileNode: FileNode = {
          name: file.name,
          type: "file",
          fileSize: file.size,
          relativePath: pathSoFar,
          file,
        };
        currFolder.children[part] = fileNode;
        filesBuffer.push(file);
        filesRelativePath.push(pathSoFar + "/" + file.name);
        ancestors.forEach((f) => (f.totalSize += file.size));
      } else {
        if (!currFolder.children[part]) {
          pathSoFar += `/${part}`;
          currFolder.children[part] = {
            name: part,
            type: "folder",
            children: {},
            totalSize: 0,
            relativePath: pathSoFar,
          };
        }
        currFolder = currFolder.children[part] as FolderNode;
        ancestors.push(currFolder);
      }
    }
  });

  return [root, filesBuffer, filesRelativePath];
}

export function buildFileTree(files: File[]): FileNode[] | null {
  if (!files || files.length === 0) return null;

  return files.map((file) => ({
    name: file.name,
    type: "file",
    fileSize: file.size,
    file,
    relativePath: file.webkitRelativePath,
  }));
}
