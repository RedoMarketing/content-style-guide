import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabase = createClient(
  "https://jjezreqahluvohgxpoma.supabase.co",
  "sb_publishable_rptD8XEPS6N1GWIDl6yJzg_QPoKTFzH"
);
const BUCKET = "videos";

// source_id -> variant creative ids (all IMAGE creatives) for the live ads.
const VARIANTS = {
  "1e949d4e223bbf8e7cd0335292223426": ["572a39585623bd69bde350fd95667dba", "a9af540bd19a8590e2470de6e2917860"],
  "371a9bb8eb55817821e43ff26fb0bf95": ["415828de1e339c6a73656cbe30474501"],
  "68bd35cfcdc76f8bfad517b5e3f0aa18": ["457bfd748b71b8202bb402e6f85e4b24", "78b91495f43f8a9dda3549d6ee14abd7"],
  "e8cbec051c8f670923d0019fce4456f4": ["2c5214e795c3aa277206196da8c19d13", "572a39585623bd69bde350fd95667dba"],
  "c74e7a5dd348f5280dbc8c6e19cbecfa": ["77a64c782a1d95dc174e94c5bf78ca4e", "c996edebc61cdf6904bd937d8aa24e75"],
  "9ccdc519280cb2b92e5f7ab89c81dcf6": ["84a6621ccd4a33c1b3f6a899dc9ffdcb", "b232caf4eacccefedc5743151688845f"],
  "8eb26be6d2b48f0c63eb488ed2a2a082": ["4221c2857a725f422ff437f20ed9b64d", "c7dea2df9240f4276a8ec5a4a8cc696b"],
};

let ok = 0, fail = 0;
for (const [sid, vids] of Object.entries(VARIANTS)) {
  try {
    const { data: rows, error } = await supabase
      .from("videos")
      .select("id, video_path, media_type")
      .eq("source_id", sid)
      .limit(1);
    if (error) throw error;
    const row = rows?.[0];
    if (!row) { console.log(`skip (no row) ${sid}`); continue; }

    const slides = [{ path: row.video_path, media_type: row.media_type }];
    for (const vid of vids) {
      const res = await fetch(`https://r2.adspo.co/creatives/images/original/${vid}.jpg`);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const id = randomUUID();
      const path = `clips/${id}.jpg`;
      const up = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      slides.push({ path, media_type: "image" });
    }
    const upd = await supabase.from("videos").update({ slides }).eq("id", row.id);
    if (upd.error) throw upd.error;
    ok++;
    console.log(`ok  ${sid} → ${slides.length} slides`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${sid} :: ${e.message}`);
  }
}
console.log(`\nDone. Updated ${ok}, failed ${fail}.`);
