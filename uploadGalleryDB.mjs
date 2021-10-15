import ftp from "basic-ftp";
import getenv from "getenv";
import logUpdate from "log-update";
import { format } from "date-fns";
import { requestRestart } from "./serverUtils.mjs";

let today = format(new Date(), "yyyy-MM-dd_HH-mm");

example();

async function example() {
  const client = new ftp.Client();
  let last = "";

  // client.ftp.verbose = true;
  try {
    await client.access({
      host: "ftp.stedwardsfellwalkers.co.uk",
      user: "vscode@stedwardsfellwalkers.co.uk",
      password: getenv("FTPPASSWORD"),
      secure: true,
      port: 21,
      secureOptions: { servername: "ukhost4u.com" },
    });
    await client.ensureDir("/gallery");
    console.log(await client.pwd());
    let name = "gallery";
    let dbname = name + ".sqlite";
    let dbBackup = `DBbackup/${name}.${today}.sqlite`;
    const old = await client.list("gallery.old.sqlite");
    if (old.length === 1) {
      await client.remove("gallery.old.sqlite");
    }

    const curr = await client.list("gallery.sqlite");
    if (curr.length === 1) {
      await client.downloadTo(
        `DBbackup/gallery.${today}.sqlite`,
        "gallery.sqlite"
      );
      await client.rename("gallery.sqlite", "gallery.old.sqlite");
    }

    await client.uploadFrom("gallery.sqlite", "gallery.sqlite");
    await requestRestart(client);
    // await client.uploadFrom("server/gallery.sqlite", "gallery.sqlite");
  } catch (err) {
    console.log(err);
  }
  client.close();
}
