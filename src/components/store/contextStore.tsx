import { Dispatch, createContext, useContext, useReducer } from "react";

import { actionStoreType, repositoryType, storeType } from "./store";

const StoreContext = createContext<storeType | undefined>(undefined);
const StoreDispatchContext = createContext<
    Dispatch<actionStoreType> | undefined
>(undefined);

const storeData = {
    get: (key: string, def: any) => {
        const data = window.localStorage.getItem(key);
        if (data) return JSON.parse(data);
        return def;
    },
    set: (key: string, value: any) =>
        window.localStorage.setItem(key, JSON.stringify(value)),
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [tasks, dispatch] = useReducer(storeReducer, initialGit);

    return (
        <StoreContext.Provider value={tasks}>
            <StoreDispatchContext.Provider value={dispatch}>
                {children}
            </StoreDispatchContext.Provider>
        </StoreContext.Provider>
    );
}

export function useStore() {
    return useContext(StoreContext);
}

export function useStoreDispatch() {
    return useContext(StoreDispatchContext) as Dispatch<actionStoreType>;
}

function storeReducer(store: storeType, action: actionStoreType): storeType {
    switch (action.type) {
        case "change-folder": {
            let last_folders = [...store.settings.last_folders];
            last_folders.push(`${action.payload.folder}`);
            if (last_folders.length > 10) last_folders.shift();
            storeData.set("last_folders", last_folders);
            return {
                ...store,
                ...action.payload,
                settings: {
                    last_folders,
                },
            };
        }
        case "add-status": {
            return {
                ...store,
                status_message: [
                    ...store.status_message,
                    ...(action.payload.status_message || []),
                ],
            };
        }
        case "select-repo": {
            return { ...store, select_repo: action.payload.select_repo || "" };
        }
        case "new-repository": {
            store.repositories = [];
        }
        case "add-repository": {
            let repositories = [
                ...store.repositories,
                ...(action.payload.repositories || []),
            ];

            repositories = repositories.reduce(
                (p: any, d) =>
                    p.some((dd: repositoryType) => dd.name === d.name)
                        ? p
                        : [...p, d],
                [] as repositoryType[]
            );
            return {
                ...store,
                repositories,
                select_repo: repositories[0].name,
            };
        }
        case "update-repository": {
            let repo = action.payload?.repositories?.[0];
            if (!repo) return store;
            repo = {
                ...store.repositories.find((r) => r.name === repo?.name),
                ...repo,
            };
            return {
                ...store,
                repositories: [
                    ...store.repositories.filter((r) => r.name !== repo?.name),
                    repo,
                ],
            };
        }
        case "clean-repositories": {
            return { ...store, repositories: [] };
        }

        case "add-log": {
            if (!action.payload?.repositories?.[0]) return store;
            return {
                ...store,
                repositories: [
                    ...store.repositories.filter(
                        (r) => r.name !== action.payload?.repositories?.[0].name
                    ),
                    action.payload?.repositories?.[0],
                ],
            };
        }

        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}

const initialGit: storeType = {
    folder: "",
    user: "",
    output: [],
    status_message: ["init completed", "select folder for start.."],
    repositories: [],
    select_repo: "",
    settings: {
        last_folders: storeData.get("last_folders", []) as string[],
    },
};
