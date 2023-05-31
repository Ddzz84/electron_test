import { useStore } from "./store/contextStore";
import { repositoryType } from "./store/store";

export const Dashboard = () => {
    const store = useStore();
    const current_repo = store?.repositories.find(
        (r) => r.name === store.select_repo
    );

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
                                className={`btn btn-xs btn-outline ${
                                    current_repo.current_branch === b &&
                                    "btn-active"
                                }`}
                            >
                                {b}
                            </button>
                        ))}
                </div>
                <div className="btn-group ml-2">
                    <button className="btn btn-xs btn-info">Pull</button>
                    <button className="btn btn-xs btn-success">Push</button>
                    <button className="btn btn-xs btn-error">Hard Reset</button>
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
