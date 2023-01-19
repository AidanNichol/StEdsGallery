import dotenv from "dotenv";
dotenv.config();
import db from "../server/walkDB.js";
import { parseISO, format, addDays } from "date-fns";
import { parse } from "csv/sync";
import jetpack from "fs-jetpack";
const progdata = jetpack.read("setup/prog2023.csv");
import fetch from "node-fetch";

async function create() {
  const prog = parse(progdata, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count_less: true,
    trim: true,
  });
  console.log(prog);
  let lastDate = null;
  for (const walk of prog) {
    let { date } = walk;
    if (date === "") {
      lastDate = addDays(lastDate, 14);
      walk.date = format(lastDate, "yyyy-MM-dd");
    } else {
      lastDate = parseISO(date);
    }
    walk.year = format(lastDate, "yyyy");
    console.log("walk ===============>", walk);
    const res = await db.walk.create(walk);
    console.log("Local DB create", res);
    const res2 = await createWalk(walk.date);
    console.log("remote DB create", res2);
  }
}
await create();
async function createWalk(walkNo) {
  fetch(`http://localhost:5555/apiServer/walks/createWalk/${walkNo}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("createWalk responded", data);
      // walkStale.set(true);
      return data;
    })
    .catch((error) => {
      console.error("createWalk", error);
      throw new Error(error);
    });
}
