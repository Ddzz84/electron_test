import { IpcMainEvent } from "electron";

export const send_status_msg = (e: IpcMainEvent, text: string) => {
    e.sender.send("status-message", {
        text,
    });
};
