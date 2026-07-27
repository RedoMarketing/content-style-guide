import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  "https://jjezreqahluvohgxpoma.supabase.co",
  "sb_publishable_rptD8XEPS6N1GWIDl6yJzg_QPoKTFzH"
);
const BUCKET = "videos";

// Distinct main creatives from adspo (Redo brand) NOT already imported (the 16 live).
// [creative_id, "v"|"i", hook|null, landing-slug]
const ADS = [
  ["3e462d5ba755c8459d5463b4b52effe8","i",null,"products/chargebacks/representment"],
  ["be1922793a2726c2c86fc28a24ff2e1e","v","The workforce in general nowadays is just really tough to get good people.","shipping-free-trial"],
  ["02ba2b6c7b1ca8755cbc1cf848d59e11","i",null,"withdrawals"],
  ["e93c653cfc7a8dd5cc00e8812f298e1b","v","Hey!","withdrawals"],
  ["b1f421c78da0d223c0189b33da988331","i",null,"withdrawals"],
  ["240adefe9f5193f37f5b466aa2dc0551","i",null,"withdrawals"],
  ["79352a9ff21a06380cabed7a7114ce65","i",null,"search/intent-popup"],
  ["81d0bb0981a8f7c52a0e64e981714ad0","i",null,"search/intent-popup"],
  ["751b9d0194d7338e0219192184882c83","i",null,"search/intent-popup"],
  ["611064c43762dd952ee1632572c007cf","v",null,"products/recover"],
  ["623a938cdfab2b097f1b32f98bd1543a","v","We just took our customer quotes and turned them into an absolute banger.","products/recover"],
  ["1c07af9df10a3c2387998074c6d41cc1","i",null,"search/intent-popup"],
  ["0123720b9697a17c9ead75f465513292","i",null,"search/intent-popup"],
  ["a4fcbe0cdce0ddb0616a4243051a9f9e","i",null,"products/order-editing"],
  ["75f1784d798c2e6818574d215d05b4e8","i",null,"products/chargebacks"],
  ["8b446ed185f5d22a370bf2c1cea4b90e","i",null,"products/recover"],
  ["85fc120f879452769766d0f8cd7896f0","i",null,"products/recover"],
  ["722637b8db4f8c11084ba79f6bbb7a73","i",null,"products/order-editing"],
  ["a05137f641697e2afbdbcf0c06d64b5d","i",null,"products/shipping-fulfillment"],
  ["c996edebc61cdf6904bd937d8aa24e75","i",null,"products/recover"],
  ["3a8e8e08a5ba7e682ffba05fe7da9aa3","v","We just took our customer quotes and turned them into an absolute banger.","products/recover"],
  ["ac5b9ac5d6154669cd16e22b85b191ee","i",null,"products/shipping-fulfillment"],
  ["9fd474e1437b07ea445406abacc043ac","i",null,""],
  ["f0024e1ae741d84cfd8bf90736bf2c07","i",null,""],
  ["56f4de63569f72eb852a41537208c70a","i",null,"products/shipping-fulfillment"],
  ["bd25a7be8df566c9ba27fc4ca10f7cf4","i",null,"products/recover"],
  ["a78e051ed54223e9c1b5a5559781d964","i",null,"products/shipping-fulfillment"],
  ["5473ed33132f8f1ea081360ac2af8a8b","i",null,""],
  ["77a64c782a1d95dc174e94c5bf78ca4e","i",null,"products/recover"],
  ["b76be693354b7ca966c25a82be07d850","i",null,"products/recover"],
  ["b1d3302b9febe8a80c2e5828e5d399c5","v",null,""],
  ["640a818195f0508c041649ca82a5f125","i",null,""],
  ["42415bfd25e7077dc2d76f59de2cffd4","i",null,""],
  ["04d7479d443b9b65dd8fc95107ab5dba","v",null,"products/recover"],
  ["cca5a0d5d16e85af30a4c2cb32eb3f51","i",null,"products/recover"],
  ["b3a5f703c2551a6b083787a8099e940d","i",null,""],
  ["a502aa9c7933a98bbbb30823f3182202","i",null,""],
];

function titleize(land) {
  if (!land) return "Redo ad";
  const seg = land.split("/").filter(Boolean).pop();
  return "Redo · " + seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Skip anything already imported (dedupe on source_id).
const { data: have } = await supabase
  .from("videos")
  .select("source_id")
  .eq("kind", "actual");
const seen = new Set((have || []).map((r) => r.source_id).filter(Boolean));

let ok = 0, skip = 0, fail = 0;
for (const [cid, fmt, hook, land] of ADS) {
  if (seen.has(cid)) { skip++; continue; }
  try {
    const isVideo = fmt === "v";
    const u = isVideo
      ? `https://r2.adspo.co/creatives/videos/hd/${cid}.mp4`
      : `https://r2.adspo.co/creatives/images/original/${cid}.jpg`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const id = randomUUID();
    const path = `clips/${id}.${isVideo ? "mp4" : "jpg"}`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: isVideo ? "video/mp4" : "image/jpeg" });
    if (up.error) throw up.error;
    const title = hook
      ? hook.length > 80 ? hook.slice(0, 77) + "…" : hook
      : titleize(land);
    const ins = await supabase.from("videos").insert({
      title,
      kind: "actual",
      media_type: isVideo ? "video" : "image",
      stage: null,
      format: null,
      video_path: path,
      source_id: cid,
    });
    if (ins.error) throw ins.error;
    ok++;
    console.log(`ok  ${title}`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${cid} :: ${e.message}`);
  }
}
console.log(`\nDone. Added ${ok}, skipped ${skip}, failed ${fail}.`);
