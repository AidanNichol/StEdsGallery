import ftp from "basic-ftp";
import getenv from "getenv";
import logUpdate from "log-update";
import { requestRestart } from "./serverUtils.mjs";
import jetpack from "fs-jetpack";
import dotenv from "dotenv";
dotenv.config();
let lastRun;

example();

async function example() {
  const now = new Date();
  const deployLastRun = jetpack.read("./deployLastRun.txt");
  lastRun = new Date(deployLastRun);
  // console.log("lastRun", lastRun);
  const client = new ftp.Client();
  let last = "";
  client.trackProgress((info) => {
    if (last !== info.name) {
      logUpdate.done();
      last = info.name;
    }
    logUpdate(
      `File ${info.name},  Bytes ${info.bytes}, Total ${info.bytesOverall},`
    );
  });
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
    await client.ensureDir("/apiServer");
    console.log(await client.pwd());
    // await client.uploadFrom('database.sqlite', 'database.sqlite');
    // await client.uploadFrom(".env", ".env");
    let pckg = jetpack.read("package.json", "json");

    delete pckg.devDependencies;
    delete pckg.volta;
    jetpack.write("temp.json", pckg);
    await client.uploadFrom("temp.json", "package.json");
    jetpack.remove("temp.json");
    const tree = jetpack.inspectTree("server", {
      times: true,
      relativePath: true,
    });
    await uploadNewer(client, tree);
    // await client.uploadFromDir("server", "server");
    await requestRestart(client);
    console.log("deploy completed");
    jetpack.write("./deployLastRun.txt", now.toString());
    // console.log(await client.list());
  } catch (err) {
    console.log(err);
  }

  client.close();
}
async function uploadNewer(client, { children, relativePath }) {
  // console.log("uploadNewer", relativePath);
  for (const item of children) {
    if (item.type === "dir") await uploadNewer(client, item);
    if (item.type === "file") {
      if (/user-M/.test(item.name)) continue;
      const file = item.relativePath;
      if (lastRun < item.modifyTime) {
        // console.log("     upload:", file);
        await client.uploadFrom(jetpack.path(`server`, file), file);
      }
    }
  }
}
