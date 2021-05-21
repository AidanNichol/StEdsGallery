const dateFn = require("date-fns");
const fastify = require("fastify");
const jetpack = require("fs-jetpack");
const { read, exists, path, write, remove } = jetpack;
const { format } = dateFn;
const { v4: uuidv4 } = require("uuid");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const getenv = require("getenv");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

const auth_default = {
  ip: "",
  state: -1,
  id: "",
  identifier: "",
  name: "",
  roles: "",
};
const current = new Map();

exports.isOkForRole = function isOkForRole(request, role) {
  if (getenv.bool("DEVELOPMENT")) return true;
  const roles = current.get(request.cookies.authSeq);
  console.log(request.cookies.authSeq, roles, current);
  return (roles || []).includes(role);
};

exports.authRoutes = async function authRoutes(fastify, options) {
  fastify.get("/getAuth", async (request, reply) => {
    request.log.info("Some info about the current request");
    const auth = getAuthFromFile(request);
    processResponse(reply, auth);
  });

  fastify.get("/checkAuth/:role", (request, reply) => {
    const { role } = request.params;
    const authSeq = request.cookies.authSeq;

    const auth = getAuthFromFile();
    const { state, identifier, name, roles, error } = auth;

    if (auth && roles.split(",").includes(role)) {
      reply
        .setCookie("authSeq", authSeq, {
          path: "/",
          signed: true,
        })
        .send({ state, identifier, name, roles, error });
    } else {
      return { error: "you are not authorized for this action" };
    }
    return true;
  });

  function getAuthFromFile(request) {
    const { ip } = request;
    let filename = path(`data/ip-${ip}.json`);
    const auth = read(filename, "json") || { ...auth_default, ip };
    // let result = contents ? JSON.parse(contents) : ;
    auth.filename = filename;
    return auth;
  }

  function saveAuthToFile(auth) {
    console.log("saving", auth);
    write(auth.filename, auth);
    console.log("written");
  }

  function processResponse(response, auth) {
    let { filename, authSeq, verificationSeq, ...ret } =
      auth.state > 0 ? auth : auth_default;
    console.log("getAuth", auth);
    if (auth.state === 2) {
      // authSeq = uuidv4();
      authSeq = authSeq || uuidv4();
      current.set(auth, auth.roles);
      console.log("setting authSeq", authSeq);
      response = response.setCookie("authSeq", authSeq, {
        path: "/",
        signed: false,
        sameSite: "none",
        secure: true,
      });
    } else {
      current.delete(auth.authSeq);
      response = response.clearCookie("authSeq", { path: "/" });
    }

    if (auth.state >= 0) {
      delete auth.error;
      write(filename, { ...auth, authSeq });
    } else {
      console.log("removing", filename);
      filename && remove(filename);
    }

    response.send(ret);
  }
  // function getAuth(request, response) {
  //   let auth = getAuthFromFile(request);
  //   delete auth.verificationSeq;
  //   return auth;
  // }

  fastify.get("/logout", (request, response) => {
    let auth = getAuthFromFile(request);
    auth.state = -1;
    processResponse(response, auth);
    // remove(device.file);

    // auth = { ...auth_default };
    // const { state, identifier, name, error, roles, authSeq } = device;

    // response
    //   .clearCookie("authSeq", {
    //     path: "/",
    //     signed: true,
    //   })
    //   .send({ state, identifier, name, roles, error });
  });

  function findMember(field, ids) {
    const authUsers = [
      {
        id: "M1049",
        name: "Aidan Nichol",
        mobile: "07748245774",
        email: "aidan@nicholware.co.uk",
        roles: "tester,uploader,admin",
      },
      {
        id: "M825",
        name: "Peter Reed",
        mobile: "07761064556",
        email: "pr2@blueyonder.co.uk",
        roles: "committee,tester,uploader",
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
      const { identifier, role } = request.params;
      let auth = getAuthFromFile(request);

      auth.error = null;

      // if($device['state']!==0)return this-logout($request, $response);

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
        // logger->info("changeStatus", (array) member);
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
          filename: auth.filename,
        };

        if (isEmail) await sendEmail(auth);
        else await sendText(auth);
        // saveAuthToFile(auth);
      }
      processResponse(response, auth);
      // delete auth.verificationSeq;
      // const { state, name, error, via } = auth;
      // return { state, identifier, name, error, via };
    }
  );

  fastify.get("/checkVerfication/:verification", async (request, response) => {
    const { verification } = request.params;
    const auth = getAuthFromFile(request);
    let authSeq = "";
    auth.error = null;
    // logout resets everthing and can be called in any state

    if (auth.state !== 1) {
      auth.state = -1;
      auth.error = `Internal error - server not expecting verification code (${auth.state})`;
      processResponse(reply, auth);
      // return logout(
      //   request,
      //   response,
      // );
    } else if (auth.verificationSeq === verification) {
      auth.state = 2;
      // auth.verificationSeq = "";
      // authSeq = uuidv4();
      // request.log.info(`authSeq`, authSeq);
      // auth.authSeq = authSeq;

      // saveAuthToFile(auth);
    } else {
      request.log.info(`mismatch: ${auth.verificationSeq} !== ${verification}`);
      auth.error = "verfification code does not match";
      // logger->error(`changeStatus error:${device.error}`, [device['verificationSeq'], verification]);
    }
    processResponse(response, auth);
    // const { state, identifier, name, error, roles } = auth;

    // response
    //   .setCookie("authSeq", authSeq, {
    //     path: "/",
    //     signed: true,
    //   })
    //   .send({ state, identifier, name, roles, error });
  });
};
function expandMobile(id) {
  id = id.replaceAll(" ", "");
  if (id[0] === "0") id = id.substr(1);
  if (substr(id, 0, 3) === "+44") id = id.substr(3);
  if (substr(id, 0, 2) === "44") id = id.substr(2);

  return ["0" + id, "+44" + id, "44" + id];
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
