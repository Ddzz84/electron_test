import { ipcMain, dialog } from "electron";
import fs from "fs";
import { GitFn } from "../libs/gitfn";
import { send_status_msg } from "./status-message";
import { repositoryType } from "@/components/store/store";
import { delay, get_status } from "../libs/tools";
import { BranchSummary } from "simple-git";

class GitRepositories {
    git_occupated = false;
    repo_list: GitFn[] = [];

    add_repo(dir: string) {
        this.repo_list.push(new GitFn(dir));
    }

    list_name() {
        return this.repo_list.map((r) => r.name);
    }

    async exec(
        action: Exclude<keyof GitFn, "repogit" | "name">,
        repo_name: string | number,
        arg?: any
    ) {
        if (!this.git_occupated) {
            this.git_occupated = true;
            const repo =
                typeof repo_name === "string"
                    ? this.repo_list.find((r) => r.name === repo_name)
                    : this.repo_list[repo_name];

            const risp = repo && (await repo[action](arg));
            this.git_occupated = false;
            return risp;
        } else {
            await delay(1000);
            this.exec(action, repo_name, arg);
        }
    }

    async execAll(action: Exclude<keyof GitFn, "repogit" | "name">, arg?: any) {
        if (!this.git_occupated) {
            this.git_occupated = true;
            const resp = this.repo_list.map(async (repo) => {
                return repo && (await repo[action](arg));
            });
            this.git_occupated = false;
            return resp;
        } else {
            await delay(1000);
            this.execAll(action, arg);
        }
    }
}

export const repositories = new GitRepositories();

export function repository(win: Electron.BrowserWindow) {
    //
    ipcMain.on("choose-folder", async (event) => {
        const result = await dialog.showOpenDialog(win, {
            properties: ["openDirectory"],
        });
        if (result.canceled) {
            event.sender.send("select-folder", { dir: null });
            send_status_msg(event, "folder not selected");
        } else {
            const dir = result.filePaths[0];

            try {
                const submodule = fs.existsSync(`${dir}/.gitmodules`);
                let sublist: repositoryType[] = [];
                repositories.add_repo(dir);

                const { current } = (await repositories.exec(
                    "fetch",
                    0
                )) as BranchSummary;
                // get subrepository
                if (submodule) {
                    let sub_repo = (
                        await (repositories.exec(
                            "getSubmodule",
                            0
                        ) as ReturnType<GitFn["getSubmodule"]>)
                    )
                        .split("\n")
                        .filter(Boolean)
                        .map((str: string) => {
                            const s = str
                                .split(/([+ ])(.*) (.*) (.*)/g)
                                .filter(Boolean);
                            return s[2];
                        });
                    for (let i = 0; i < sub_repo.length; i++) {
                        repositories.add_repo(`${dir}/${sub_repo[i]}`);
                        const { current, ...status } = get_status(
                            await (repositories.exec(
                                "getStatus",
                                i + 1
                            ) as ReturnType<GitFn["getStatus"]>)
                        );
                        sublist.push({
                            current_branch: current || "",
                            name: sub_repo[i],
                            status,
                            sub: true,
                        });
                    }
                }
                //
                send_status_msg(
                    event,
                    `branch: ${current}${
                        submodule ? ` [submodules (${sublist.length})]` : ""
                    }`
                );
                event.sender.send("project", {
                    repo: {
                        name: dir.split(/[\/\\]/).pop(),
                        current_branch: current,
                        status: get_status(
                            await (repositories.exec(
                                "getStatus",
                                0
                            ) as ReturnType<GitFn["getStatus"]>)
                        ),
                        branchs: (
                            await (repositories.exec(
                                "getBranchs",
                                0
                            ) as ReturnType<GitFn["getBranchs"]>)
                        ).all,
                        sub: false,
                    } as repositoryType,
                    sublist,
                });

                event.sender.send("select-folder", {
                    dir,
                    user: Object.values(
                        (
                            await (repositories.exec(
                                "getConfig",
                                0
                            ) as ReturnType<GitFn["getConfig"]>)
                        ).values
                    )[0]["user.name"],
                });
                send_status_msg(event, dir);
            } catch (e) {
                send_status_msg(event, `! read folder ${e}`);
            }
        }
    });

    ipcMain.on("get-log", async (e, { repo_name }) => {
        try {
            e.sender.send("send-log", { ...(await get_log(repo_name)) });
        } catch (err) {
            send_status_msg(e, `Error - get log: ${err}`);
            console.log({ err });
        }
    });

    ipcMain.on("branch-lib", async (event, { branch }) => {
        const list_repo = repositories.list_name();
        const list_repo_status = (await repositories.execAll(
            "getStatus"
        )) as ReturnType<GitFn["getStatus"]>[];

        for (const repo_name of list_repo) {
            const status = await (repositories.exec(
                "getStatus",
                repo_name
            ) as ReturnType<GitFn["getStatus"]>);
            if (
                status.files.length === 0 ||
                (status.modified.length > 0 &&
                    status.modified.every((f) => list_repo.includes(f)))
            ) {
                await repositories.exec("setBranch", repo_name, branch);
                await repositories.exec("pull", repo_name);
                const status = await (repositories.exec(
                    "getStatus",
                    repo_name
                ) as ReturnType<GitFn["getStatus"]>);
                event.sender.send("update-project", {
                    branch,
                    name: repo_name,
                    status: {
                        created: status.created,
                        deleted: status.deleted,
                        modified: status.modified,
                    },
                });
            } else {
                send_status_msg(
                    event,
                    `Warning, founded ${status.files.length} files changes in ${repo_name}`
                );
            }
        }
        send_status_msg(
            event,
            `Completed - set branch ${branch} for each repository`
        );
    });

    ipcMain.on("repo-cmd", async (e, { repo_name, cmd, arg }) => {
        try {
            switch (cmd) {
                case "h_reset": {
                    const status = await (repositories.exec(
                        "getStatus",
                        repo_name
                    ) as ReturnType<GitFn["getStatus"]>);
                    await repositories.exec("reset", repo_name);
                    await repositories.exec("hard_reset", repo_name);
                    e.sender.send("send-log", {
                        ...(await get_log(repo_name)),
                    });
                    return send_status_msg(
                        e,
                        `Reset Hard for ${repo_name} Completed`
                    );
                }
                case "pull": {
                    await repositories.exec("pull", repo_name);
                    e.sender.send("send-log", {
                        ...(await get_log(repo_name)),
                    });
                    return send_status_msg(e, `Pull ${repo_name} Completed`);
                }
                case "checkout": {
                    await repositories.exec("setBranch", repo_name, arg[0]);
                    await repositories.exec("pull", repo_name);

                    const logs = await get_log(repo_name);

                    e.sender.send("send-log", {
                        ...logs,
                    });

                    return send_status_msg(
                        e,
                        `Checkout ${repo_name} - ${arg[0]} Completed`
                    );
                }
            }
        } catch (err) {
            send_status_msg(e, `Error repo-cmd: ${err}`);
        }
    });
}

ipcMain.on("new-branch", (_e, { branch, repositories }) => {
    if (`${branch}`.includes("hotfix")) {
        // form master
    } else {
        // from staging
    }
});

const parseLogs = (l: any) =>
    Array.isArray(l)
        ? l.map((c) => ({
              refs: c.refs
                  .split(", ")
                  .flatMap((cr: string) => cr.split(" -> ")),
              hash: c.hash,
              hashAbbrev: c.hashAbbrev,
              tree: c.tree,
              treeAbbrev: c.treeAbbrev,
              parents: c.parents.split(","),
              parentsAbbrev: c.parentsAbbrev,
              author: {
                  name: c.a_name,
                  email: c.a_email,
                  timestamp: c.a_timestamp,
              },
              committer: {
                  name: c.c_name,
                  email: c.c_email,
                  timestamp: c.c_timestamp,
              },
              subject: c.subject,
              body: c.body,
              notes: c.notes,
              stats: c.stats.split(","),
          }))
        : [];

const get_log = async (repo_name: string) => {
    let status = await (repositories.exec("getStatus", repo_name) as ReturnType<
        GitFn["getStatus"]
    >);
    let branchs = await (repositories.exec(
        "getBranchs",
        repo_name
    ) as ReturnType<GitFn["getBranchs"]>);

    let logs = parseLogs(
        (
            await (repositories.exec("getLogs", repo_name) as ReturnType<
                GitFn["getLogs"]
            >)
        )?.all
    );
    for (const b of branchs?.all || []) {
        await repositories.exec("setBranch", repo_name, b);
        logs = [
            ...logs,
            ...parseLogs(
                (
                    await (repositories.exec(
                        "getLogs",
                        repo_name
                    ) as ReturnType<GitFn["getLogs"]>)
                )?.all
            ),
        ];
    }
    await repositories.exec("setBranch", repo_name, status?.current);

    const { not_added, conflicted, created, deleted, modified } =
        (await (repositories.exec("getStatus", repo_name) as ReturnType<
            GitFn["getStatus"]
        >)) || {};

    return {
        repo_name,
        logs,
        branchs: branchs?.all,
        current_branch: status?.current,
        status: { not_added, conflicted, created, deleted, modified },
    };
};
