import simpleGit, { SimpleGit } from "simple-git";

export class GitFn {
    repogit: SimpleGit;
    name: string;

    constructor(folder: string) {
        this.repogit = simpleGit(folder);
        this.name = folder.split(/[\/\\]/g).pop() || "";
    }

    fetch() {
        this.repogit.fetch();
        return this.repogit.branch();
    }
    pull() {
        return this.repogit.pull();
    }
    push() {
        // return this.repogit.push();
    }
    getBranchs() {
        return this.repogit.branch();
    }

    getStatus() {
        return this.repogit.status();
    }
    getTags() {
        return this.repogit.tags();
    }
    getSubmodule() {
        return this.repogit.subModule(["status"]);
    }

    setBranch(branch: string) {
        return this.repogit.checkout(branch);
    }
    reset(arg?: string[]) {
        return this.repogit.reset(arg);
    }
    hard_reset(branch: string) {
        return this.reset(["--hard", `origin/${branch}`]);
    }

    getLogs() {
        return this.repogit.log({
            maxCount: 10,
            symmetric: false,
            multiLine: true,
            splitter: ";",
            format: {
                refs: "%D",
                hash: "%H",
                hashAbbrev: "%h",
                tree: "%T",
                treeAbbrev: "%t",
                parents: "%P",
                parentsAbbrev: "%p",
                a_name: "%an",
                a_email: "%ae",
                a_timestamp: "%at",
                c_name: "%cn",
                c_email: "%ce",
                c_timestamp: "%ct",
                subject: "%s",
                body: "%b",
                notes: "%N",
                stats: "",
            },
        });
    }
}
