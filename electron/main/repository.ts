import { ipcMain, dialog } from "electron";
import fs from "fs";
import { GitFn } from "../libs/gitfn";
import { send_status_msg } from "./status-message";
import { repositoryType } from "@/components/store/store";
import { get_status } from "../libs/tools";

let repositories: GitFn[] = [];

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
                repositories = [new GitFn(dir)];
                const { current, ...status } = get_status(
                    await repositories[0].getStatus()
                );

                if (submodule) {
                    let sub_repo = (await repositories[0].getSubmodule())
                        .split("\n")
                        .filter(Boolean)
                        .map((str: string) => {
                            const s = str
                                .split(/([+ ])(.*) (.*) (.*)/g)
                                .filter(Boolean);
                            return s[2];
                        });
                    for (let i = 0; i < sub_repo.length; i++) {
                        repositories.push(new GitFn(`${dir}/${sub_repo[i]}`));
                        const { current, ...status } = get_status(
                            await repositories[i + 1].getStatus()
                        );
                        sublist.push({
                            current_branch: current || "",
                            name: sub_repo[i],
                            status,
                            sub: true,
                        });
                    }
                }

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
                        status,
                        branchs: (await repositories[0].getBranchs()).all,
                        sub: false,
                    } as repositoryType,
                    sublist,
                });

                event.sender.send("select-folder", { dir });
                send_status_msg(event, dir);
            } catch (e) {
                send_status_msg(event, `! read folder ${e}`);
            }
        }
    });

    ipcMain.on("get-log", async (event, arg) => {
        const repo = repositories.find((r) => r.name === arg.repo);
        let branchs = await repo?.getBranchs();

        let logs = parseLogs((await repo?.getLogs())?.all);
        for (const b of branchs?.all || []) {
            if (b !== branchs?.current && !b.includes("origin")) {
                repo?.setBranch(b);
                logs = [...logs, ...parseLogs((await repo?.getLogs())?.all)];
            }
        }
        repo?.setBranch("staging");
        event.sender.send("send-log", {
            logs,
            branchs: branchs?.all,
        });
    });

    ipcMain.on("branch-lib", async (event, { branch }) => {
        const list_repo = repositories.map((r) => r.name);
        for (const repo of repositories) {
            const status = await repo.getStatus();

            if (
                status.files.length === 0 ||
                (status.modified.length > 0 &&
                    status.modified.every((f) => list_repo.includes(f)))
            ) {
                await repo.setBranch(branch);
                await repo.pull();
                const status = await repo.getStatus();
                event.sender.send("update-project", {
                    branch,
                    name: repo.name,
                    status: {
                        created: status.created,
                        deleted: status.deleted,
                        modified: status.modified,
                    },
                });
            } else {
                send_status_msg(
                    event,
                    `Warning, founded ${status.files.length} files changes in ${repo.name}`
                );
            }
        }
        send_status_msg(
            event,
            `Completed - set branch ${branch} for each repository`
        );
    });
}

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
