import React, { useEffect, useMemo, useState } from "react";
import { FileNode, FolderNode } from "../lib/folderTreeAlgo";

// File card
export const RenderFile = React.memo(({ dto }: { dto: FileNode }) => {
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow duration-200">
      <div className="card-body">
        <h2 className="card-title">
          <span className="text-blue-600">{dto.name}</span>
          <div className="badge badge-outline badge-sm ml-2">{dto.type}</div>
        </h2>
        <p>
          <span className="font-semibold">Size:</span> {dto.fileSize}
        </p>
        <p className="text-sm text-gray-500">{dto.relativePath}</p>
      </div>
    </div>
  );
});

// Folder card
export const RenderFolder = React.memo(
  ({
    dto,
    getNewNode,
  }: {
    dto: FolderNode;
    getNewNode: (dto: Array<FileNode | FolderNode>, path: string) => void;
  }) => {
    const children: (FileNode | FolderNode)[] = Object.values(dto.children);

    return (
      <div
        className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow duration-200 cursor-pointer"
        onClick={() => {
          if (children.length >= 1) {
            getNewNode(children, dto.name);
          }
        }}
      >
        <div className="card-body">
          <h2 className="card-title text-green-600">
            {dto.name}
            <div className="badge badge-outline badge-sm ml-2">
              {children.length} items
            </div>
          </h2>
          <p>
            <span className="font-semibold">Total size:</span> {dto.totalSize}
          </p>
          <p className="text-sm text-gray-500">{dto.relativePath}</p>
        </div>
      </div>
    );
  }
);

// Container with pagination
export function ResourceContainer({
  userResources,
  getNewNode,
}: {
  userResources: Array<FileNode | FolderNode>;
  getNewNode: (dto: Array<FileNode | FolderNode>, path: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const currentPageResources = useMemo(() => {
    const start = (page - 1) * pageSize;
    return userResources.slice(start, start + pageSize);
  }, [userResources, page]);

  useEffect(() => {
    setPage(1);
    return () => {};
  }, [userResources]);

  return (
    <div className="space-y-6">
      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPageResources.map((resource, idx) => {
          if (resource.type === "file") {
            return (
              <RenderFile key={resource.name} dto={resource as FileNode} />
            );
          } else {
            return (
              <RenderFolder
                key={resource.name}
                getNewNode={getNewNode}
                dto={resource as FolderNode}
              />
            );
          }
        })}
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center items-center space-x-4">
        <button
          className="btn btn-outline"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span className="font-medium">
          Page <strong>{page}</strong> of{" "}
          <strong>{Math.ceil(userResources.length / pageSize)}</strong>
        </span>
        <button
          className="btn btn-primary"
          onClick={() => setPage((p) => p + 1)}
          disabled={page * pageSize >= userResources.length}
        >
          Next
        </button>
      </div>
    </div>
  );
}
