export type commitType = {
    hash: string;
    message: string;
    date: string;
    author_name: string;
    author_email: string;
};

export type repositoryType = {
    name: string;
    current_branch: string;
    sub?: boolean;
    status: {
        not_added?: string[];
        conflicted?: string[];
        created?: string[];
        deleted?: string[];
        modified?: string[];
    };
    commits?: commitType[];
    branchs?: string[];
};

export type storeType = {
    folder: string;
    output: string[];
    status_message: string[];
    repositories: repositoryType[];
    select_repo: string;
    settings: {
        last_folders: string[];
    };
};

export type actionStoreType = {
    type: actionType;
    payload: Partial<storeType>;
};

export type actionType =
    | "change-folder"
    | "add-status"
    | "add-repository"
    | "update-repository"
    | "clean-repositories"
    | "select-repo"
    | "add-log"
    | "new-repository";
