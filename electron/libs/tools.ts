import { StatusResult } from "simple-git";

export const get_status = (status: StatusResult) => {
    const { not_added, conflicted, created, deleted, modified, current } =
        status;
    return {
        not_added,
        conflicted,
        created,
        deleted,
        modified,
        current,
    };
};

export function delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
