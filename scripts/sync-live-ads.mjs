import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  "https://jjezreqahluvohgxpoma.supabase.co",
  "sb_publishable_rptD8XEPS6N1GWIDl6yJzg_QPoKTFzH"
);
const BUCKET = "videos";

// The 16 currently-LIVE Redo ads from adspo (brand 552852517911834, is_active=true).
const ADS = [
  { cid: "a75c4398ead10bf7c15506a831811848", t: "video", u: "https://r2.adspo.co/creatives/videos/hd/a75c4398ead10bf7c15506a831811848.mp4", hook: "It wasn't the sacking of Troy that made Odysseus, it was the return.", land: "returnsv5" },
  { cid: "1e949d4e223bbf8e7cd0335292223426", t: "image", u: "https://r2.adspo.co/creatives/images/original/1e949d4e223bbf8e7cd0335292223426.jpg", hook: null, land: "products/chargebacks/representment" },
  { cid: "371a9bb8eb55817821e43ff26fb0bf95", t: "image", u: "https://r2.adspo.co/creatives/images/original/371a9bb8eb55817821e43ff26fb0bf95.jpg", hook: null, land: "recover-call-ship" },
  { cid: "4e601c179a97330cb4fe7b92520f3edc", t: "video", u: "https://r2.adspo.co/creatives/videos/hd/4e601c179a97330cb4fe7b92520f3edc.mp4", hook: null, land: "returnsv5" },
  { cid: "68bd35cfcdc76f8bfad517b5e3f0aa18", t: "image", u: "https://r2.adspo.co/creatives/images/original/68bd35cfcdc76f8bfad517b5e3f0aa18.jpg", hook: null, land: "returnsv5" },
  { cid: "210d950de6e750559e4ac4f9b515d501", t: "image", u: "https://r2.adspo.co/creatives/images/original/210d950de6e750559e4ac4f9b515d501.jpg", hook: null, land: "shipping-free-trial" },
  { cid: "584f30bd1034b6a13c0a18fe44a99dbc", t: "image", u: "https://r2.adspo.co/creatives/images/original/584f30bd1034b6a13c0a18fe44a99dbc.jpg", hook: null, land: "shipping-free-trial" },
  { cid: "bebd2110408af802c57578ad501f74c5", t: "video", u: "https://r2.adspo.co/creatives/videos/hd/bebd2110408af802c57578ad501f74c5.mp4", hook: "During COVID, for instance, we were completely 10 to 15 business days for all orders.", land: "shipping-free-trial" },
  { cid: "5304db4a2e04eaba8cdc4bad105f99d0", t: "image", u: "https://r2.adspo.co/creatives/images/original/5304db4a2e04eaba8cdc4bad105f99d0.jpg", hook: null, land: "shipping-free-trial" },
  { cid: "e8cbec051c8f670923d0019fce4456f4", t: "image", u: "https://r2.adspo.co/creatives/images/original/e8cbec051c8f670923d0019fce4456f4.jpg", hook: null, land: "products/chargebacks" },
  { cid: "62482896cc4895a2a9ec5b30e90dbf52", t: "image", u: "https://r2.adspo.co/creatives/images/original/62482896cc4895a2a9ec5b30e90dbf52.jpg", hook: null, land: "products/order-editing" },
  { cid: "6b8a431eb2c580dd21826fc776edf48c", t: "image", u: "https://r2.adspo.co/creatives/images/original/6b8a431eb2c580dd21826fc776edf48c.jpg", hook: null, land: "products/shipping-fulfillment" },
  { cid: "c74e7a5dd348f5280dbc8c6e19cbecfa", t: "image", u: "https://r2.adspo.co/creatives/images/original/c74e7a5dd348f5280dbc8c6e19cbecfa.jpg", hook: null, land: "products/recover" },
  { cid: "f40c9cedffd3c340a4376d29ed834178", t: "video", u: "https://r2.adspo.co/creatives/videos/hd/f40c9cedffd3c340a4376d29ed834178.mp4", hook: "has just done a chargeback saying, I'm fraudulent.", land: "products/chargebacks" },
  { cid: "9ccdc519280cb2b92e5f7ab89c81dcf6", t: "image", u: "https://r2.adspo.co/creatives/images/original/9ccdc519280cb2b92e5f7ab89c81dcf6.jpg", hook: null, land: "shipping-free-trial" },
  { cid: "8eb26be6d2b48f0c63eb488ed2a2a082", t: "image", u: "https://r2.adspo.co/creatives/images/original/8eb26be6d2b48f0c63eb488ed2a2a082.jpg", hook: null, land: "products/chargebacks/representment" },
];

function titleize(land) {
  const seg = land.split("/").filter(Boolean).pop() || "ad";
  return "Redo · " + seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// 1) Wipe existing Actuals (rows + storage objects).
const { data: existing, error: exErr } = await supabase
  .from("videos")
  .select("id, video_path, poster_path")
  .eq("kind", "actual");
if (exErr) {
  console.log("select existing error:", exErr.message);
  process.exit(1);
}
console.log(`Removing ${existing.length} existing Actuals…`);
const paths = existing.flatMap((r) => [r.video_path, r.poster_path]).filter(Boolean);
if (paths.length) {
  const rm = await supabase.storage.from(BUCKET).remove(paths);
  if (rm.error) console.log("storage remove warn:", rm.error.message);
}
if (existing.length) {
  const del = await supabase.from("videos").delete().eq("kind", "actual");
  if (del.error) console.log("row delete warn:", del.error.message);
}

// 2) Import the 16 live ads.
let ok = 0, fail = 0;
for (const [i, ad] of ADS.entries()) {
  try {
    const res = await fetch(ad.u);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const isVideo = ad.t === "video";
    const ext = isVideo ? "mp4" : "jpg";
    const ct = isVideo ? "video/mp4" : "image/jpeg";
    const id = randomUUID();
    const path = `clips/${id}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: ct });
    if (up.error) throw up.error;
    const title = ad.hook
      ? ad.hook.length > 80 ? ad.hook.slice(0, 77) + "…" : ad.hook
      : titleize(ad.land);
    const ins = await supabase.from("videos").insert({
      title,
      kind: "actual",
      media_type: isVideo ? "video" : "image",
      stage: null,
      format: null,
      video_path: path,
      source_id: ad.cid,
    });
    if (ins.error) throw ins.error;
    ok++;
    console.log(`[${i + 1}/${ADS.length}] ok  ${title}`);
  } catch (e) {
    fail++;
    console.log(`[${i + 1}/${ADS.length}] FAIL ${ad.cid} :: ${e.message}`);
  }
}
console.log(`\nDone. Actuals now = ${ok} live ads (failed ${fail}).`);
