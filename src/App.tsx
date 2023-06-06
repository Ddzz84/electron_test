import { useEffect, useRef, useState } from "react";
import { ipcRenderer } from "electron";
import { StatusBar } from "@/components/status-bar";
import { useStore, useStoreDispatch } from "./components/store/contextStore";
import "./assets/App.scss";
import {
    actionStoreType,
    commitType,
    repositoryType,
} from "./components/store/store";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { ClipLoader } from "react-spinners";
import { ArrowUpSquareIcon } from "./components/icons";
import { ModalSelectRepo } from "./components/modalRepo";

console.log(
    "[App.tsx]",
    `Hello world from Electron ${process.versions.electron}!`
);

const App = () => {
    const store = useStore();
    const dispatch = useStoreDispatch();
    const [newBranch, setNewBranch] = useState<string>();

    useEffect(() => listenerGit(dispatch), []);

    return (
        <div className="flex flex-row min-h-screen bg-gray-100 text-gray-800">
            <Sidebar />
            <main className="main flex flex-col flex-grow -ml-64 md:ml-0 transition-all duration-150 ease-in">
                <header className="header bg-white shadow py-4 px-4">
                    <GlobalCmd
                        disabled={store?.repositories.length === 0}
                        setBranch={setNewBranch}
                    />
                </header>
                <div className="main-content flex flex-col flex-grow">
                    <div className="text-xs breadcrumbs text-zinc-500 bg-slate-200 px-2 py-0">
                        <ul>
                            <li>{store?.folder || ""}</li>
                        </ul>
                    </div>
                    {Boolean(store?.repositories?.length) && <Dashboard />}
                </div>
            </main>
            <StatusBar />
            {Boolean(newBranch) && (
                <ModalSelectRepo
                    newBranch={newBranch}
                    close={() => setNewBranch(undefined)}
                />
            )}
        </div>
    );
};

export default App;

// ####################################################################### //

const listenerGit = (dispatch: React.Dispatch<actionStoreType>) => {
    ipcRenderer.on("status-message", (_e, d) => {
        dispatch({
            type: "add-status",
            payload: { status_message: [d.text] },
        });
    });

    ipcRenderer.on("project", (_e, d) => {
        dispatch({
            type: "new-repository",
            payload: {
                repositories: [
                    d.repo as repositoryType,
                    ...(d.sublist as repositoryType[]),
                ],
            },
        });
    });

    ipcRenderer.on("update-project", (_e, d) => {
        dispatch({
            type: "update-repository",
            payload: {
                repositories: [
                    {
                        current_branch: d.branch,
                        name: d.name,
                        status: d.status,
                    },
                ],
            },
        });
    });

    ipcRenderer.on("send-log", (_e, arg) => {
        const logs = arg.logs as commitType[];
        let repo: repositoryType = {
            name: arg.repo_name,
            branchs: arg.branchs,
            current_branch: arg.current_branch,
            status: arg.status,
        };
        if (repo) {
            repo.commits = logs;
            repo.branchs = arg.branchs;
            dispatch({
                type: "update-log",
                payload: { repositories: [repo] },
            });
        }
    });
};

const GlobalCmd: React.FC<{
    disabled: boolean;
    setBranch: (s: string) => void;
}> = ({ disabled, setBranch }) => {
    const store = useStore();
    const [loading, setLoading] = useState("");

    useEffect(() => {
        const last_note = [...(store?.status_message || [])].pop();
        if (last_note?.includes("Completed") || last_note?.includes("Error"))
            setLoading("");
    }, [store?.status_message]);

    return (
        <div className="header-content flex items-center flex-row justify-between">
            {["staging", "master"].map((b) => (
                <button
                    key={b}
                    disabled={disabled}
                    className="btn btn-xs btn-info btn-outline"
                    onClick={() => {
                        setLoading(b);
                        ipcRenderer.send("branch-lib", { branch: b });
                    }}
                >
                    {b.toUpperCase()} LIB{" "}
                    {loading === b && (
                        <ClipLoader
                            color="currentColor"
                            size={16}
                            className="float-right ml-2"
                        />
                    )}
                </button>
            ))}

            <button
                disabled={disabled}
                className="btn btn-xs btn-primary btn-outline"
                title="Publish Quality"
            >
                <ArrowUpSquareIcon className="w-5 h-5" />
            </button>
            <div className="btn-group">
                {["feature", "bugfix", "hotfix"].map((t) => (
                    <button
                        key={t}
                        disabled={disabled}
                        className="btn btn-xs"
                        onClick={() => setBranch(t)} // window.select_repositories.showModal()}
                    >
                        new <span className="capitalize">{t}</span>*
                    </button>
                ))}
            </div>
        </div>
    );
};
