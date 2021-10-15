import ftp from "basic-ftp";
import getenv from "getenv";
import logUpdate from "log-update";
import { format } from "date-fns";
let today = format(new Date(), "yyyy-MM-ddTHH:mm");

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
    await client.downloadTo(dbBackup, dbname);
    await client.downloadTo(dbname, dbname);
  } catch (err) {
    console.log(err);
  }
  client.close();
}
