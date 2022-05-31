import initCycleTLS from "cycletls";
import { CyleTlsWrapper } from "./CycleTlsWrapper";
//import { encryptOzSg, generateOzSg } from "./generate";
//import { genScSign } from "./genSign";
import { randomInteger } from "./utils";

const username = ""; // account's mail here
const password = ""; // account's password here
const resolution = 3686400; // fixed but needs to be randomly generated
/** ja3 and user agent of the browser we are spoofing, needs to be coherent with everything else */
const baseRequestParams = {
  ja3: "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36 OPR/85.0.4341.75",
  baseHeader: {},
};
/** base parameters of whiteops for soundclound */
const baseOzokiParams = {
  ci: 646297,
  dt: 6462971605583802699000n,
  mo: 2,
  pd: "acc",
  spa: 1,
  ri: "signInPasswordForm",
  et: "1",
  ui: "",
};

(async () => {
  // Initiate CycleTLS

  let keysEventNumber = randomInteger(6, 14);
  let clickEventNumber = randomInteger(6, 14);

  let deviceId = [
    Math.floor(1e6 * Math.random()),
    Math.floor(1e6 * Math.random()),
    Math.floor(1e6 * Math.random()),
    Math.floor(1e6 * Math.random()),
  ].join("-");

  const loginParams = {
    OZ_DT: "",
    OZ_SG: "",
    OZ_TC: "",
    client_ds: {
      ci: baseOzokiParams.ci,
      ck: new Buffer(deviceId).toString("base64"),
      et: baseOzokiParams.et,
      mo: baseOzokiParams.mo,
      pd: baseOzokiParams.pd,
      ri: baseOzokiParams.ri,
      si: "",
      ui: baseOzokiParams.ui,
    },
    client_id: "",
    credentials: {
      identifier: username,
      password: password,
    },
    device_id: deviceId,
    recaptcha_pubkey: "6Lf_t_wUAAAAACyAReaZlQzxI0fxbxhNCwrngjp6",
    recaptcha_response: null,
    signature: "",
    user_agent: baseRequestParams.userAgent,
  };

  const cycleTLS = await initCycleTLS();
  const requestTLS = new CyleTlsWrapper(cycleTLS, baseRequestParams);

  // Get client id
  const soundCloudHomePageResp = (await requestTLS.get("https://soundcloud.com/")).body;
  let jsScriptId = /\/assets\/49\-([a-z0-9]+)/.exec(soundCloudHomePageResp)![0];
  const jsScriptResp = (await requestTLS.get(`https://a-v2.sndcdn.com${jsScriptId}.js`)).body;
  let clientId = /,client\_id\:(["A-Za-z0-9]+)/.exec(jsScriptResp)![0].split('"')[1].split('"')[0];
  loginParams.client_id = clientId;
  loginParams.client_ds.si = new Buffer(clientId).toString("base64");

  // Get oz_dt and oz_tc
  const clearJsResp = (
    await requestTLS.get(
      `https://s.pwt.soundcloud.com/ag/${baseOzokiParams.ci}/clear.js?ci=${baseOzokiParams.ci}&dt=${baseOzokiParams.dt}&mo=${baseOzokiParams.mo}&pd=${baseOzokiParams.pd}&spa=${baseOzokiParams.spa}`
    )
  ).body;
  let ozTc = /ozoki_tc = \"([a-z0-9A-Z]+)/.exec(clearJsResp)![1];
  let ozDt = /ozoki_dt = \"([a-z0-9A-Z\+\/\\\=]+)/.exec(clearJsResp)![1];
  let pageSpeedVersion = /PAGESPEED_VERSION=\"([0-9\.]+)/.exec(clearJsResp)![1];
  loginParams.OZ_DT = ozDt;
  loginParams.OZ_TC = ozTc;

  // Get signatureSecret
  const oneTapResp = (
    await requestTLS.get(
      `https://secure.soundcloud.com/one-tap?client_id=${clientId}&device_id=${deviceId}&app_id=46941&start_url=https%3A%2F%2Fsoundcloud.com%2F&&start_view=sign_in`
    )
  ).body;
  let oneTapJsId = /\/one_tap-([0-9a-z]+)/.exec(oneTapResp)![0];
  const oneTapJsReq = (await requestTLS.get(`https://secure.sndcdn.com${oneTapJsId}.js`)).body;
  let signatureSecret = /__SIGN_IN_SIGNATURE_SECRET__=\"([a-z0-9]+)/.exec(oneTapJsReq)![0].split('"')[1];

  // Generate the signature
  loginParams.signature = genScSign(
    resolution,
    keysEventNumber,
    keysEventNumber,
    clickEventNumber,
    baseRequestParams.userAgent,
    clientId,
    username,
    signatureSecret
  );

  // Generate and encrypt OZ_SG payload
  loginParams.OZ_SG = encryptOzSg(
    generateOzSg(
      ozTc,
      pageSpeedVersion,
      clientId,
      deviceId,
      resolution,
      keysEventNumber,
      keysEventNumber,
      clickEventNumber,
      baseRequestParams.userAgent
    ),
    ozTc
  );

  // Make the login request
  await requestTLS.post(`https://api-auth.soundcloud.com/web-auth/sign-in/password?client_id=${clientId}`, JSON.stringify(loginParams));

  cycleTLS.exit();
})();
