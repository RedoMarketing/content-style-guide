import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  "https://jjezreqahluvohgxpoma.supabase.co",
  "sb_publishable_rptD8XEPS6N1GWIDl6yJzg_QPoKTFzH"
);
const BUCKET = "videos";

// Distinct main creatives pulled from adspo (Redo brand, latest 3 pages).
const ADS = [
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/a75c4398ead10bf7c15506a831811848.mp4", hook: "It wasn't the sacking of Troy that made Odysseus, it was the return.", land: "returnsv5" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/3e462d5ba755c8459d5463b4b52effe8.jpg", hook: null, land: "products/chargebacks/representment" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/1e949d4e223bbf8e7cd0335292223426.jpg", hook: null, land: "products/chargebacks/representment" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/371a9bb8eb55817821e43ff26fb0bf95.jpg", hook: null, land: "recover-call-ship" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/4e601c179a97330cb4fe7b92520f3edc.mp4", hook: null, land: "returnsv5" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/68bd35cfcdc76f8bfad517b5e3f0aa18.jpg", hook: null, land: "returnsv5" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/210d950de6e750559e4ac4f9b515d501.jpg", hook: null, land: "shipping-free-trial" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/584f30bd1034b6a13c0a18fe44a99dbc.jpg", hook: null, land: "shipping-free-trial" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/be1922793a2726c2c86fc28a24ff2e1e.mp4", hook: "The workforce in general nowadays is just really tough to get good people.", land: "shipping-free-trial" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/bebd2110408af802c57578ad501f74c5.mp4", hook: "During COVID, for instance, we were completely 10 to 15 business days for all orders.", land: "shipping-free-trial" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/02ba2b6c7b1ca8755cbc1cf848d59e11.jpg", hook: null, land: "withdrawals" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/e93c653cfc7a8dd5cc00e8812f298e1b.mp4", hook: "Hey!", land: "withdrawals" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/b1f421c78da0d223c0189b33da988331.jpg", hook: null, land: "withdrawals" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/240adefe9f5193f37f5b466aa2dc0551.jpg", hook: null, land: "withdrawals" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/79352a9ff21a06380cabed7a7114ce65.jpg", hook: null, land: "search/intent-popup" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/81d0bb0981a8f7c52a0e64e981714ad0.jpg", hook: null, land: "search/intent-popup" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/751b9d0194d7338e0219192184882c83.jpg", hook: null, land: "search/intent-popup" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/5304db4a2e04eaba8cdc4bad105f99d0.jpg", hook: null, land: "shipping-free-trial" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/611064c43762dd952ee1632572c007cf.mp4", hook: null, land: "redo-recover" },
  { t: "video", u: "https://r2.adspo.co/creatives/videos/hd/623a938cdfab2b097f1b32f98bd1543a.mp4", hook: "We just took our customer quotes and turned them into an absolute banger.", land: "redo-recover" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/1c07af9df10a3c2387998074c6d41cc1.jpg", hook: null, land: "search/intent-popup" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/0123720b9697a17c9ead75f465513292.jpg", hook: null, land: "search/intent-popup" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/a4fcbe0cdce0ddb0616a4243051a9f9e.jpg", hook: null, land: "products/order-editing" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/75f1784d798c2e6818574d215d05b4e8.jpg", hook: null, land: "products/chargebacks" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/8b446ed185f5d22a370bf2c1cea4b90e.jpg", hook: null, land: "products/recover" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/85fc120f879452769766d0f8cd7896f0.jpg", hook: null, land: "products/recover" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/722637b8db4f8c11084ba79f6bbb7a73.jpg", hook: null, land: "products/order-editing" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/e8cbec051c8f670923d0019fce4456f4.jpg", hook: null, land: "products/chargebacks" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/62482896cc4895a2a9ec5b30e90dbf52.jpg", hook: null, land: "products/order-editing" },
  { t: "image", u: "https://r2.adspo.co/creatives/images/original/a05137f641697e2afbdbcf0c06d64b5d.jpg", hook: null, land: "products/shipping-fulfillment" },
];

function titleize(land) {
  const seg = land.split("/").filter(Boolean).pop() || "ad";
  return (
    "Redo · " +
    seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

let ok = 0;
let fail = 0;
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

    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: ct, upsert: false });
    if (up.error) throw up.error;

    const title = ad.hook
      ? ad.hook.length > 80
        ? ad.hook.slice(0, 77) + "…"
        : ad.hook
      : titleize(ad.land);

    const ins = await supabase.from("videos").insert({
      title,
      kind: "actual",
      media_type: isVideo ? "video" : "image",
      stage: null,
      format: null,
      description: null,
      video_path: path,
    });
    if (ins.error) throw ins.error;
    ok++;
    console.log(`[${i + 1}/${ADS.length}] ok  ${title}`);
  } catch (e) {
    fail++;
    console.log(`[${i + 1}/${ADS.length}] FAIL ${ad.u} :: ${e.message}`);
  }
}
console.log(`\nDone. Imported ${ok}, failed ${fail}.`);
