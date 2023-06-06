import Update from "@/components/update";
import { useEffect, useState } from "react";
import { useStore, useStoreDispatch } from "./store/contextStore";
import { ClipLoader } from "react-spinners";
import { ipcRenderer } from "electron";

import logoArca from "../assets/logo.webp";

export const Sidebar: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useStoreDispatch();
    const store = useStore();
    const parent_repo = store?.repositories.find((r) => !r.sub);

    const open_folder = () => {
        setLoading(true);
        dispatch({
            type: "add-status",
            payload: {
                status_message: ["Fetching repository..."],
            },
        });
        ipcRenderer.send("choose-folder");
        ipcRenderer.once("select-folder", (_e, d) => {
            dispatch({
                type: "change-folder",
                payload: { folder: d.dir, user: d.user },
            });
            setLoading(false);
        });
    };

    const ItemMenu: React.FC<{
        select_repo: string;
        className: string;
        branch: string;
    }> = ({ select_repo, className, branch }) => (
        <li className={className}>
            <a
                href="#"
                className="indicator w-full"
                onClick={() => {
                    dispatch({
                        type: "select-repo",
                        payload: { select_repo },
                    });
                    console.log("click repo", select_repo);
                    ipcRenderer.send("get-log", { repo_name: select_repo });
                }}
            >
                <span
                    className={`indicator-item indicator-bottom ${
                        parent_repo?.current_branch !== branch &&
                        "bg-error text-slate-800"
                    } badge badge-xs badge-secondary mr-4 `}
                >
                    <small>{branch}</small>
                </span>
                <div className="grid place-items-center">{select_repo}</div>
            </a>
        </li>
    );

    return (
        <aside className="sidebar w-64 md:shadow transform -translate-x-full md:translate-x-0 transition-transform duration-150 ease-in bg-slate-800">
            <div className="sidebar-header flex items-center justify-center py-4">
                <div className="inline-flex">
                    <img src={logoArca} className="w-10" />
                    <a
                        href="https://gitlab.arca24.com/"
                        target="_blank"
                        className="inline-flex flex-row items-center"
                    >
                        <span className="leading-10 text-gray-100 text-2xl font-bold ml-1 uppercase">
                            Arca24 GIT
                        </span>
                    </a>
                </div>
            </div>
            <small className="px-4 text-slate-50">user: {store?.user}</small>
            <div className="sidebar-content px-4 py-6">
                <ul className="flex flex-col w-full mb-2">
                    <li className="my-px">
                        <button
                            className={`btn btn-xs btn-success w-full ${
                                store?.repositories.length || 0 > 0
                                    ? "opacity-50 hover:opacity-100"
                                    : ""
                            }`}
                            onClick={open_folder}
                        >
                            Select folder{" "}
                            {loading && (
                                <ClipLoader
                                    color="#fff"
                                    size={16}
                                    className="float-right ml-2"
                                />
                            )}
                        </button>
                    </li>
                    <li>
                        <Update />
                    </li>
                </ul>
                <hr />
                {Boolean(store?.repositories.length) && (
                    <ul className="menu menu-compact mt-2  text-slate-50">
                        <ItemMenu
                            select_repo={parent_repo?.name || ""}
                            branch={parent_repo?.current_branch || ""}
                            className={
                                "text-sm " +
                                (parent_repo?.name === store?.select_repo &&
                                    "bordered font-bold")
                            }
                        />
                    </ul>
                )}
                <ul className="menu menu-compact ml-3 text-slate-200">
                    {store?.repositories
                        .filter((r) => r.sub)
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((repo) => (
                            <ItemMenu
                                key={repo.name}
                                branch={repo?.current_branch || ""}
                                select_repo={repo?.name || ""}
                                className={
                                    "text-xs " +
                                    (repo?.name === store?.select_repo &&
                                        "bordered font-bold")
                                }
                            />
                        ))}
                </ul>
            </div>
        </aside>
    );
};
