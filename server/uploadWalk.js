const ftp = require("basic-ftp");
const getenv = require("getenv");
const logUpdate = require("log-update");
const jetpack = require("fs-jetpack");
const _ = require("lodash");

async function uploadWalk(walkNo) {
  await uploadfiles(walkNo);
  const currData = await db.walk.findByPk(walkNo, {
    include: [db.route],
  });
  fetch(
    `https://www.stedwardsfellwalkers.co.uk/walk/updateWalkWithRemoteData/${walkNo}`,

    {
      method: "post",
      body: JSON.stringify(currData),
    },
    false
  )
    .then((res) => res.json())
    .then((data) => {
      console.log("uploadWalk responded", data);
      // walkStale.set(true);
      return data;
    });
  // .catch(handleError);
}
async function uploadfiles(walkNo) {
  const walkdata = "/Users/aidan/Websites/htdocsC/walkdata";

  const walkdir = `/${walkNo.substr(0, 4)}/${walkNo}`;
  const libdir = `${walkdata}/${walkdir}`;

  const client = new ftp.Client();
  let last = "";
  // client.trackProgress((info) => {
  //   if (last !== info.name) {
  //     logUpdate.done();
  //     last = info.name;
  //   }
  //   logUpdate(
  //     `File ${info.name},  Bytes ${info.bytes}, Total ${info.bytesOverall},`
  //   );
  // });
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
    await client.ensureDir(`/public_html/walkdata/${walkdir}`);
    // console.log(await client.pwd());
    // const list = await client.list("*.*");
    // // console.log("list", list);
    let tree = jetpack.inspectTree(libdir, { times: true }).children;
    let files = tree.filter((f) => /(.jpg|.pdf|.json)$/.test(f.name));
    let uList = [];
    for (const f of files) {
      let { name, size } = f;
      let res = await client.uploadFrom(`${libdir}/${name}`, name);
      console.log(`uploaded ${name}  ${formatFileSize(size)}`);
      uList.push({ name, size });
    }
    console.log(`uploaded ${files.length} files`);
    // console.log("inspect", tree.children[0].modifyTime);
    // await client.uploadFromDir(libdir);
  } catch (err) {
    console.log(err);
  }
  client.close();
}

function formatFileSize(fileSize) {
  if (fileSize < 1024) {
    return fileSize + " B";
  } else if (fileSize < 1024 * 1024) {
    var temp = fileSize / 1024;
    temp = temp.toFixed(1);
    return temp + " KB";
  } else if (fileSize < 1024 * 1024 * 1024) {
    var temp = fileSize / (1024 * 1024);
    temp = temp.toFixed(1);
    return temp + " MB";
  } else {
    var temp = fileSize / (1024 * 1024 * 1024);
    temp = temp.toFixed(1);
    return temp + " GB";
  }
}

async function updateWalkWithRemoteData(db, walkNo, body) {
  const { routes, walk } = body;
  const currData = await db.walk.findByPk(walkNo, {
    include: [db.route],
  });
  if (!currData) {
    await db.walk.create(walk);
  } else {
    await db.walk.update(walk, { where: { date: walkNo } });
  }
  for (const route of routes) {
    if (currData.routes.find((r) => r.no === route.no)) {
      await db.route.update(route, { where: { date: walkNo, no: route.no } });
    } else {
      await db.route.create(route);
    }
  }
  return { result: "ok" };
}

module.exports = { uploadWalk, updateWalkWithRemoteData };
