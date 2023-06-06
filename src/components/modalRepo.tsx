import { useRef, useState } from "react";
import { useStore } from "./store/contextStore";
import { ipcRenderer } from "electron";

export const ModalSelectRepo: React.FC<{
    newBranch?: string;
    close: () => void;
}> = ({ newBranch, close }) => {
    const store = useStore();
    const [repositories, setRepositories] = useState<string[]>([]);
    const refInput = useRef<HTMLInputElement>(null);
    return (
        <>
            <input
                type="checkbox"
                checked={true}
                readOnly
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box">
                    Select Sub-repository:
                    <div className="grid grid-cols-3 mt-3 w-full">
                        <small className="">name</small>
                        <div className="form-control col-span-2">
                            <label className="input-group input-group-xs">
                                <span className="bg-gray-300">
                                    {newBranch}/
                                </span>
                                <input
                                    ref={refInput}
                                    type="text"
                                    placeholder="name"
                                    className="input input-bordered input-xs w-full"
                                />
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        {store?.repositories
                            .filter((r) => r.sub)
                            .map((repo) => (
                                <label
                                    className="label cursor-pointer"
                                    key={repo.name}
                                >
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-sm toggle-primary"
                                        checked={repositories.some(
                                            (r) => r === repo.name
                                        )}
                                        onChange={(e) =>
                                            e.currentTarget.checked
                                                ? setRepositories([
                                                      ...repositories,
                                                      repo.name,
                                                  ])
                                                : setRepositories(
                                                      repositories.filter(
                                                          (r) => r !== repo.name
                                                      )
                                                  )
                                        }
                                    />
                                    <small className="label-text text-xs text-gray-800">
                                        {repo.name}
                                    </small>
                                </label>
                            ))}
                    </div>
                    <div className="modal-action">
                        <button
                            className="btn btn-sm"
                            onClick={() => {
                                setRepositories([]);
                                close();
                            }}
                        >
                            Undo
                        </button>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                if (refInput.current?.value)
                                    ipcRenderer.send("new-branch", {
                                        branch: `${newBranch}/${refInput.current?.value.replace(
                                            /[^a-z0-9]/gi,
                                            "_"
                                        )}`,
                                        repositories,
                                    });
                                close();
                            }}
                        >
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
