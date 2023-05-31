import Update from "@/components/update";
import { useEffect, useState } from "react";
import { useStore, useStoreDispatch } from "./store/contextStore";
import { ClipLoader } from "react-spinners";
import { ipcRenderer } from "electron";

import logoArca from "../assets/logo.webp";
import { commitType } from "./store/store";

export const Sidebar: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useStoreDispatch();
    const store = useStore();
    const parent_repo = store?.repositories.find((r) => !r.sub);

    useEffect(() => {
        if (store?.select_repo) {
            ipcRenderer.send("get-log", { repo: store.select_repo });

            ipcRenderer.once("send-log", (e, arg) => {
                const logs = arg.logs as commitType[];
                let repo = store.repositories.find(
                    (r) => r.name === store.select_repo
                );
                if (repo) {
                    repo.commits = logs;
                    repo.branchs = arg.branchs;
                    dispatch({
                        type: "add-log",
                        payload: { repositories: [repo] },
                    });
                }
            });
        }
    }, [store?.select_repo]);

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
                payload: { folder: d.dir },
            });
            setLoading(false);
        });
    };

    const ItemMenu: React.FC<{ select_repo: string }> = ({ select_repo }) => (
        <li
            className={
                select_repo === store?.select_repo ? "bordered font-bold" : ""
            }
        >
            <a
                href="#"
                onClick={() =>
                    dispatch({
                        type: "select-repo",
                        payload: { select_repo },
                    })
                }
            >
                {select_repo}
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
                                    className="float-right mr-2"
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
                    <ul className="menu menu-compact mt-2 text-sm text-slate-50">
                        <ItemMenu select_repo={parent_repo?.name || ""} />
                    </ul>
                )}
                <ul className="menu menu-compact ml-3 text-sm text-slate-200">
                    {store?.repositories
                        .filter((r) => r.sub)
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((repo) => (
                            <ItemMenu
                                key={repo.name}
                                select_repo={repo?.name || ""}
                            />
                        ))}
                </ul>
            </div>
        </aside>
    );
};