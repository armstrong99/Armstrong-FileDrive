"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaFolder,
  FaChevronRight,
  FaUpload,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowUp,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  buildFileTree,
  buildFolderTree,
  FileNode,
  FolderNode,
} from "../lib/folderTreeAlgo";
import { ResourceContainer } from "../components/renderResources";
import { ToastContainer, toast } from "react-toastify";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const pathMap: Map<string, Array<FileNode | FolderNode>> = new Map();

interface IStagingBlob {
  totalNum: number;
  names: string[];
  totalSize: number;
  messsage: string;
  isStaged: boolean;
  type: "file" | "folder";
  node: FileNode[] | FolderNode | null;
  folderFilesBuffer?: File[];
  folderFilesRelativePaths?: string[];
}

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB in bytes

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [userResources, setUserResources] = useState<
    Array<FileNode | FolderNode>
  >([]);
  const [paths, setPaths] = useState<string[]>(["Home"]);
  const [fileStaging, setfileStaging] = useState<IStagingBlob>({
    totalNum: 0,
    names: [],
    totalSize: 0,
    messsage: "",
    isStaged: false,
    type: "file",
    node: null,
  });

  const getNewNode = useCallback(
    (dto: Array<FileNode | FolderNode>, relativePath: string) => {
      setUserResources(dto);
      pathMap.set(relativePath, dto);
      setPaths((prev) => [...prev, relativePath]);
    },
    []
  );

  const fetchUserResources = async (): Promise<void> => {
    const res = await fetch(`/api/user/resources`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // include cookies if you’re using next-auth
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || `Failed to load resources (status ${res.status})`;
      toast.error(message, {
        type: "error",
        delay: 20000,
      });
    }

    const data = (await res.json()) as Array<FileNode | FolderNode>;

    setUserResources(data);
    pathMap.set(paths[0], data);
  };
  useEffect(() => {
    // initialize root
    fetchUserResources();
    return () => {
      pathMap.clear();
    };
  }, []);

  const handleBackPropagation = (pathIdx: number) => {
    // remove deeper entries
    for (let i = pathIdx + 1; i < paths.length; i++) {
      pathMap.delete(paths[i]);
    }
    const newPath = paths.slice(0, pathIdx + 1);
    setUserResources(pathMap.get(paths[pathIdx])!);
    setPaths(newPath);
  };

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertInLocaluserResource = (dto: FileNode[] | FolderNode) => {
    switch (Array.isArray(dto)) {
      case true:
        const nr = [...pathMap.get(paths[0])!, ...(dto as FileNode[])];
        pathMap.set(paths[0], nr);

        if (paths.length === 1) {
          setUserResources((prev) => [...prev, ...(dto as FileNode[])]);
        }
        break;
      case false:
        const nr2 = [...pathMap.get(paths[0])!, dto as FolderNode];
        pathMap.set(paths[0], nr2);
        if (paths.length === 1) {
          setUserResources((prev) => [...prev, dto as FolderNode]);
        }
      default:
        break;
    }
  };

  const handleFolderUpload = (files: File[]) => {
    const uploadedNode: [FolderNode, File[], string[]] | null =
      buildFolderTree(files);
    console.log(uploadedNode);
    // max limit: 250MB
    if (uploadedNode) {
      if (uploadedNode[0].totalSize > MAX_FILE_SIZE) {
        alert("Sorry Folder Size is too large (above 250mb)");
      }
      setfileStaging((prev) => ({
        ...prev,
        totalNum: 1,
        totalSize: uploadedNode[0].totalSize,
        names: [uploadedNode[0].name],
        messsage: "You are about to upload 1 folder",
        isStaged: true,
        type: "folder",
        node: uploadedNode[0],
        folderFilesBuffer: uploadedNode[1],
        folderFilesRelativePaths: uploadedNode[2],
      }));
    }
  };

  const handleFileUpload = (files: File[]) => {
    const uploadedNode: FileNode[] | null = buildFileTree(files);
    const currFileSize: number =
      uploadedNode?.reduce((prev, curr) => prev + curr.fileSize, 0) ?? 0;
    const currFileNames: string[] = uploadedNode?.map((file) => file.name)!;

    if (currFileSize > MAX_FILE_SIZE) {
      alert("Sorry file Size is too large (above 250mb)");
    }
    if (uploadedNode) {
      setfileStaging((prev) => ({
        ...prev,
        totalNum: uploadedNode.length,
        totalSize: currFileSize,
        names: currFileNames,
        messsage: `You are about to upload ${uploadedNode.length} file(s)`,
        isStaged: true,
        type: "file",
        node: uploadedNode,
      }));
    }
  };

  const handleUploadResource = async () => {
    if (fileStaging.isStaged) {
      if (fileStaging.type === "file") {
        const toastId = toast("Uploading your file", {
          type: "info",
          delay: Infinity,
        });
        const formData = new FormData();

        const stageFiles = (fileStaging.node as FileNode[]).map((file) => {
          formData.append("files", file.file!);
          file.file = undefined;
          return file;
        });

        formData.append("fileNodes", JSON.stringify(stageFiles));

        const response = await fetch("/api/upload/files", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.dismiss(toastId);

          toast.success("Your file(s) upload was successful");
          insertInLocaluserResource(fileStaging.node as FileNode[]);
          setfileStaging({
            totalNum: 0,
            names: [],
            totalSize: 0,
            messsage: "",
            isStaged: false,
            type: "file",
            node: null,
          });
        } else {
          toast("Error uploading file, pls try again", {
            type: "error",
            delay: 10000,
          });
        }
      } else {
        const toastId = toast("Uploading your folder", {
          type: "info",
          delay: Infinity,
        });
        const formData = new FormData();
        formData.append("folderNode", JSON.stringify(fileStaging.node));
        formData.append(
          "filePaths",
          JSON.stringify(fileStaging.folderFilesRelativePaths)
        );
        fileStaging.folderFilesBuffer?.map((file) => {
          formData.append("files", file);
        });

        const response = await fetch("/api/upload/folder", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.dismiss(toastId);
          toast.success("Your folder upload was successful");
          insertInLocaluserResource(fileStaging.node as FolderNode);
          setfileStaging({
            totalNum: 0,
            names: [],
            totalSize: 0,
            messsage: "",
            isStaged: false,
            type: "file",
            node: null,
            folderFilesBuffer: [],
            folderFilesRelativePaths: [],
          });
        } else {
          console.log(response);
          toast("Error uploading file, pls try again", {
            type: "error",
            delay: 10000,
          });
        }
      }
    }
  };

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <section className="container mx-auto p-6">
      <ToastContainer />
      <header className="flex justify-end items-center mb-6 space-x-4">
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt="Your avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="btn btn-ghost btn-sm flex items-center gap-2"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </header>
      {/* panel file/folder upload */}
      <section className="card bg-base-100 shadow-lg p-6 rounded-box mb-6">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={folderInputRef}
          className="hidden"
          {...{ webkitdirectory: "true" }}
          multiple
          onChange={(e) => handleFolderUpload(Array.from(e.target.files!))}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={(e) => handleFileUpload(Array.from(e.target.files!))}
        />

        {/* Upload buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            className="btn btn-outline btn-primary flex-1 gap-2"
            onClick={() => folderInputRef.current?.click()}
          >
            <FaUpload />
            Upload Folder
          </button>
          <button
            className="btn btn-outline btn-secondary flex-1 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload />
            Upload Files
          </button>
        </div>

        {/* Staging area */}
        {fileStaging.isStaged && (
          <div className="mt-6 space-y-4 animate-fade-in-up">
            {/* File info alert */}
            <div
              className={`alert ${
                fileStaging.totalSize > MAX_FILE_SIZE
                  ? "alert-error"
                  : "alert-info"
              }`}
            >
              <div className="flex items-center gap-3">
                {fileStaging.totalSize > MAX_FILE_SIZE ? (
                  <FaExclamationCircle className="flex-shrink-0 text-xl" />
                ) : (
                  <FaCheckCircle className="flex-shrink-0 text-xl" />
                )}
                <div>
                  <h3 className="font-bold">
                    {fileStaging.totalSize > MAX_FILE_SIZE
                      ? "File Size Exceeded"
                      : "Files Ready"}
                  </h3>
                  <div className="text-xs">
                    {fileStaging.totalNum} files •{" "}
                    {(fileStaging.totalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                className="btn btn-ghost flex-1"
                onClick={() =>
                  setfileStaging({ ...fileStaging, isStaged: false })
                }
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1 gap-2"
                onClick={handleUploadResource}
              >
                <FaArrowUp />
                Upload Now
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Breadcrumb */}
      <nav className="breadcrumb bg-base-200 p-3 rounded-lg mb-6">
        <ul className="flex items-center space-x-1 text-sm">
          {paths.map((label, idx) => (
            <li key={`${label}-${idx}`} className="flex items-center">
              <button
                className={`btn btn-ghost btn-sm px-2 ${
                  idx === paths.length - 1 ? "font-bold" : ""
                }`}
                onClick={() => handleBackPropagation(idx)}
                disabled={idx === paths.length - 1}
              >
                {idx === 0 ? <FaFolder className="mr-1" /> : null}
                {label}
              </button>
              {idx < paths.length - 1 && (
                <FaChevronRight className="text-gray-500 mx-1" />
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Resource grid with pagination */}
      <ResourceContainer
        userResources={userResources}
        getNewNode={getNewNode}
      />
    </section>
  );
}
