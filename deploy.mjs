import ftp from "basic-ftp";
import getenv from "getenv";
import logUpdate from "log-update";
import { requestRestart } from "./serverUtils.mjs";
import jetpack from "fs-jetpack";
import dotenv from "dotenv";
import _ from "lodash";
import fetch from "node-fetch";
dotenv.config();
let lastRun;

example();

async function example() {
  const now = new Date();
  let tree;
  const deployLastData = jetpack.read("./deployLastData.json", "json");
  // let deployLastData = {}; // force full upload
  // await serverVersion("start");
  const client = new ftp.Client();
  const isNewer = (curData) => {
    const path = curData.relativePath.split("/").filter((p) => p !== ".");
    let oldData = deployLastData;
    for (const p of path) {
      oldData = oldData[p];
      if (!oldData) return true;
    }
    if (curData.sha512 !== oldData.sha512) return true;
    return false;
  };
  const uploadNewer = async (tree) => {
    // console.log("uploadNewer", relativePath);
    for (const [key, data] of _.entries(tree)) {
      if (key === "type") continue;
      if (data.type === "dir") await uploadNewer(data);
      else {
        if (isNewer(data)) {
          const file = jetpack.path(`server`, data.relativePath);
          console.log(`     upload: ${file}
					         to: ${data.relativePath}`);
          await client.uploadFrom(file, data.relativePath);
          if (data.relativePath === "./upload.php") {
            console.log(`     copyto: /home/ajnichol/public_html/upload.php`);
          }
        }
      }
    }
  };

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
      secure: "explicit",
      port: 21,
      // secureOptions: { servername: "ukhost4u.com" },
    });
    await client.ensureDir("/apiServer");
    console.log(await client.pwd());
    // await client.uploadFrom(".env", ".env");
    const pckg = jetpack.read("package.json", "json");

    // rome-ignore lint/performance/noDelete: <explanation>
    delete pckg.devDependencies;
    pckg.volta = undefined;
    jetpack.write("temp.json", pckg);
    await client.uploadFrom("temp.json", "package.json");
    jetpack.remove("temp.json");
    tree = jetpack.inspectTree("server", {
      times: true,
      relativePath: true,
      checksum: "sha512",
    });
    // tree = {server:preprocessTree(tree)};
    tree = preprocessTree(tree);
    await client.ensureDir("/apiServer/server");
    console.log(await client.pwd());

    await uploadNewer(tree);
    // // await client.uploadFromDir("server", "server");
    await requestRestart(client);
    console.log("restart requested");
    await serverVersion("end");

    console.log("deploy completed");
    jetpack.write("./deployLastData.json", tree);
    // console.log(await client.list());
  } catch (err) {
    console.log(err);
  }

  client.close();
}
function preprocessTree(tree) {
  const newTree = { type: "dir" };
  for (const item of tree.children) {
    if (item.type === "dir") {
      if (/^(gallery|data|temp)$/.test(item.name)) continue;
      newTree[item.name] = preprocessTree(item);
      continue;
    }
    if (item.type === "file") {
      if (/user-M|\.DS_Store/.test(item.name)) continue;
      newTree[item.name] = _.pick(item, [
        "modifyTime",
        "relativePath",
        "sha512",
      ]);
    }
  }
  return newTree;
}
async function serverVersion(when) {
  const resp = await fetch(
    "https://stedwardsfellwalkers.co.uk/apiServer/walks"
  );
  const server = await resp.json();
  console.log(`Server version - ${when}:`, server.version);
}
