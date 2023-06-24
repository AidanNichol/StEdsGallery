const dateFn = require("date-fns");
// const fastify = require("fastify");
const jetpack = require("fs-jetpack");
const { read, exists, path, write, remove } = jetpack;
const { format } = dateFn;
const { v4: uuidv4 } = require("uuid");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const getenv = require("getenv");
const { find } = require("fs-jetpack");
const mailgun = new Mailgun(formData);
const TMClient = require("textmagic-rest-client");

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});
const current = new Map();
console.log("cwd", jetpack.cwd());
const userFiles = jetpack.find(".", { matching: "data/user-*.json" });
for (const memFile of userFiles) {
  console.log("ip", memFile);
  const { roles, name, authseq, memid, fingerprint } = jetpack.read(
    memFile,
    "json"
  );
  console.log("file", { roles, name, authseq, memid, fingerprint });
  current.set(fingerprint, { roles, name, authseq, memid });
}
const auth_default = {
  state: -1,
  memid: "",
  identifier: "",
  name: "",
  roles: "",
};

exports.isOkForRole = function isOkForRole(request, role, alwaysReturn) {
  // return true;
  // if (getenv.bool("DEVELOPMENT")) return true;
  const authToken=request.headers["auth-token"]??request.body.authToken;
  const authSeq=request.headers.authseq??request.body.authseq;
  const { roles = [], authseq } = current.get(authToken);
  const authSeqMatch = authSeq === authseq;
  const hasRole = roles.includes(role) || roles.includes("admin");
  const OK = authSeqMatch && hasRole;
  console.log(request.headers.authseq, authseq, roles, OK);
  console.log(current);
  if (!OK && !alwaysReturn)
    throw Error(
      `not authorized for role: ${role}. ${
        authSeqMatch ? "" : "bad authSeq. "
      }${hasRole ? "" : `doesn't have that role`}`
    );
  return OK;
};

exports.authRoutes = async function authRoutes(fastify, options) {
  fastify.get("/getAuth", async (request, reply) => {
    request.log.info("Some info about the current request");
    const auth = getAuthFromFile(request);
    processResponse(request, reply, auth);
  });

  fastify.get("/checkAuth/:role", (request, reply) => {
    const { role } = request.params;
    const authseq = request.headers.authseq;

    const auth = getAuthFromFile();
    const { state, identifier, name, roles, error } = auth;

    if (auth && roles.split(",").includes(role)) {
      reply.send({ state, identifier, name, roles, error });
    } else {
      return { error: "you are not authorized for this action" };
    }
    return true;
  });

  function getAuthFromFile(request) {
    let {
      "auth-token": fingerprint,
      "member-id": memid,
      "auth-seq": authseq,
    } = request.headers;
    if (memid === "undefined") {
      const fpData = current.get(fingerprint);
      memid = (fpData || {}).memid;
    }
    let filename = path(`data/user-${memid}.json`);
    let auth = read(filename, "json") || auth_default;
    if (auth.fingerprint !== fingerprint) auth = auth_default;

    return { ...auth, fingerprint, filename };
  }

  function saveAuthToFile(request, auth) {
    console.log("saving", auth);
    write(auth.filename, {
      ...auth,
      fingerprint: request.headers["auth-token"],
    });
    console.log("written");
  }

  function processResponse(request, response, auth) {
    let {
      filename,
      authseq,
      verificationSeq,
      memid,
      fingerprint,
      roles,
      ...ret
    } = auth.state > 0 ? auth : auth_default;
    console.log("getAuth", auth);
    if (auth.state === 2) {
      authseq = authseq || uuidv4();
      auth.authseq = authseq;
      delete auth.error;
      current.set(fingerprint, auth);
      console.log("setting authSeq", authseq);
    }

    if (auth.state >= 0) {
      saveAuthToFile(request, { ...auth, authseq });
    } else {
      console.log("removing", filename);
      filename && remove(filename);
      current.has(fingerprint) && current.delete(fingerprint);
    }
    const resp = { ...ret, authseq, roles };
    console.log("process response", resp);
    response.send(resp);
  }

  fastify.get("/logout", (request, response) => {
    let auth = getAuthFromFile(request);
    jetpack.remove(auth.filename);
    current.delete(auth.fingerprint);
    auth = { ...auth_default };
    processResponse(request, response, auth);
  });

  function findMember(field, ids) {
    const authUsers = [
      {
        memid: "M1049",
        name: "Aidan Nichol",
        mobile: "07748245774",
        email: "aidan@nicholware.co.uk",
        roles: "tester,uploader,admin",
      },
      {
        memid: "M825",
        name: "Peter Reed",
        mobile: "07761064556",
        email: "pr2@blueyonder.co.uk",
        roles: "committee,tester,uploader,admin",
      },
    ];
    for (const value of authUsers) {
      if (ids.includes(value[field])) {
        return value;
      }
    }
    return false;
  }
  fastify.get(
    "/checkIdentifier/:identifier/:role",
    async (request, response) => {
      // Check the identifier and send verification code
      let { identifier, role } = request.params;
      let auth = getAuthFromFile(request);

      auth.error = null;

      const isEmail = identifier.includes("@");
      const ids = isEmail ? [identifier] : expandMobile(identifier);
      const field = isEmail ? "email" : "mobile";
      const member = findMember(field, ids);

      if (member === false) {
        auth.error =
          "No member with a " +
          (isEmail ? "email address" : "mobile phone number") +
          ` of ${identifier} was found.`;
      } else {
        identifier = ids[0];
        let via = isEmail ? "email" : "text";
        let verificationSeq = Math.floor(
          Math.random() * (999999 - 100000) + 100000
        ).toString();
        auth = {
          state: 1,
          ...member,
          identifier,
          via,
          verificationSeq,
          filename: path(`data/user-${member.memid}.json`),
        };
        current.set(request.headers["auth-token"], auth);

        if (isEmail) await sendEmail(auth);
        else await sendText(auth);
      }
      processResponse(request, response, auth);
    }
  );

  fastify.get("/checkVerfication/:verification", async (request, response) => {
    const { verification } = request.params;
    const auth = getAuthFromFile(request);
    let authseq = "";
    auth.error = null;

    if (auth.state !== 1) {
      auth.state = -1;
      auth.error = `Internal error - server not expecting verification code (${auth.state})`;
      processResponse(request, response, auth);
    } else if (auth.verificationSeq === verification) {
      auth.state = 2;
      auth.verificationSeq = "";
    } else {
      request.log.info(`mismatch: ${auth.verificationSeq} !== ${verification}`);
      auth.error = "verfification code does not match";
    }
    processResponse(request, response, auth);
  });
};
function expandMobile(id) {
  id = id.replace(/ /g, "");
  if (id[0] === "0") id = id.substr(1);
  if (id.substr(0, 3) === "+44") id = id.substr(3);
  if (id.substr(0, 2) === "44") id = id.substr(2);
  return ["+44" + id, "44" + id, "0" + id];
}
async function sendEmail(device) {
  const to = `${device.name} <${device.identifier}>`;
  try {
    const resp = await mg.messages.create(getenv("MAILGUN_DOMAIN"), {
      from: "St.Edward's Fellwalkers <postmaster@mg.nicholware.co.uk>",
      to: to,
      subject: "Verification code",
      text: `Your Verification code for authenticated access to St. Edwards Fellwalkers is ${device.verificationSeq}`,
      html: `Your Verification code for authenticated access to St. Edwards Fellwalkers is <span style=\"font-size: larger; font-weight: bold;\">${device.verificationSeq}</span>`,
    });
    console.log(resp); // logs response data
  } catch (error) {
    console.log(err); // logs any error
  }
}
async function sendText(device) {
  console.log("sendtext", device);
  var c = new TMClient(getenv("TEXTMAGIC_NAME"), getenv("TEXTMAGIC_PASSWORD"));
  const text = `Your Verification code for authenticated access to St. Edwards Fellwalkers is ${device.verificationSeq}`;
  c.Messages.send({ text, phones: device.identifier }, function (err, res) {
    console.log("Messages.send()", err, res);
  });
}
