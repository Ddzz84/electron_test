import { ipcRenderer } from "electron";
import { useStore } from "./store/contextStore";
import { repositoryType } from "./store/store";
import { ClipLoader } from "react-spinners";
import { useEffect, useState } from "react";

export const Dashboard = () => {
    const store = useStore();
    const [loading, setLoading] = useState(false);
    const current_repo = store?.repositories.find(
        (r) => r.name === store.select_repo
    );

    useEffect(() => {
        setLoading(false);
    }, [current_repo?.current_branch]);

    const repo_cmd = (cmd: string, arg?: string) => {
        ipcRenderer.send("repo-cmd", {
            repo_name: current_repo?.name,
            cmd,
            arg: [arg ?? current_repo?.current_branch],
        });
    };

    console.log(current_repo);

    return (
        <div className="content p-2">
            <header className="flex flex-row justify-between">
                <div className="btn-group">
                    {current_repo?.branchs
                        ?.filter((b) => !b.includes("origin"))
                        .map((b) => (
                            <button
                                key={b}
                                onClick={() => {
                                    setLoading(true);
                                    current_repo.current_branch !== b &&
                                        repo_cmd("checkout", b);
                                }}
                                className={`btn btn-xs btn-outline ${
                                    current_repo.current_branch === b &&
                                    "btn-active"
                                }`}
                            >
                                {b}{" "}
                                {loading && (
                                    <ClipLoader
                                        color="currentColor"
                                        size={16}
                                        className="float-right ml-2"
                                    />
                                )}
                            </button>
                        ))}
                </div>
                <div className="btn-group ml-2">
                    <button
                        className="btn btn-xs btn-outline btn-info"
                        onClick={() => repo_cmd("pull")}
                    >
                        Pull
                    </button>
                    <button className="btn btn-xs btn-outline btn-success">
                        Push
                    </button>
                    <button
                        className="btn btn-xs btn-outline btn-error"
                        onClick={() =>
                            confirm(
                                `Reset hard ${current_repo?.current_branch}? 
                                Delete all your unstage files`
                            ) && repo_cmd("h_reset")
                        }
                    >
                        Hard Reset
                    </button>
                </div>
                <select
                    className="select select-xs select-bordered max-w-xs"
                    defaultValue={"Remote branchs.."}
                >
                    <option disabled>Remote branchs..</option>
                    {current_repo?.branchs
                        ?.filter((b) => b.includes("origin"))
                        .map((b) => (
                            <option key={b}>{b}</option>
                        ))}
                </select>
            </header>
            <div className="w-full overflow-hidden">
                <div className="card card-compact">
                    <div className="card-title">Some changes to commit</div>
                    {Boolean(current_repo?.status) &&
                        [
                            "conflicted",
                            "not_added",
                            "modified",
                            "created",
                            "deleted",
                        ].map((s) => (
                            <div key={s}>
                                <small>{s}:</small>
                                <pre className="ml-4 text-xs">
                                    {current_repo?.status?.[
                                        s as keyof repositoryType["status"]
                                    ]?.join("\n")}
                                </pre>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
