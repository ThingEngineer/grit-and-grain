import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { embedMany } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";

// ---------- Seed data definitions ----------

const pastures = [
  {
    name: "North Pasture",
    acres: 40,
    notes: "Cool-season mix, fescue dominant. Creek runs along north edge.",
  },
  {
    name: "South Pasture",
    acres: 35,
    notes: "Warm-season grasses. Tends to dry out in late summer.",
  },
  {
    name: "East Hay Field",
    acres: 25,
    notes: "Primarily orchard grass and clover. Cut for hay 1-2x per season.",
  },
  {
    name: "West Bottom",
    acres: 20,
    notes:
      "Low-lying area near creek. Rich soil, holds moisture well. Floods occasionally.",
  },
];

const herdGroups = [
  {
    name: "Angus Cow-Calf Pairs",
    species: "cattle",
    head_count: 32,
    notes: "Main herd. Spring calving season Feb-April.",
  },
  {
    name: "Yearling Steers",
    species: "cattle",
    head_count: 15,
    notes: "Backgrounding group. Target weight 850 lbs by fall.",
  },
];

// Helper type for referencing inserted IDs by name
type IdMap = Record<string, string>;

/**
 * Build the 12-month diary entry set.
 * pasture/herd IDs are looked up from the maps by name.
 */
function buildDiaryEntries(
  pastureIds: IdMap,
  herdIds: IdMap,
): Array<{
  entry_date: string;
  pasture_id: string | null;
  herd_group_id: string | null;
  content: string;
  tags: string[];
}> {
  const north = pastureIds["North Pasture"];
  const south = pastureIds["South Pasture"];
  const east = pastureIds["East Hay Field"];
  const west = pastureIds["West Bottom"];
  const cowCalf = herdIds["Angus Cow-Calf Pairs"];
  const yearlings = herdIds["Yearling Steers"];

  return [
    // ---- Summer 2023 (dry year — historical reference) ----
    {
      entry_date: "2023-06-20",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Rain has been almost nonexistent this month — only 0.3 inches all of June. South Pasture warm-season grasses are holding up better than expected. The bermuda is still thick enough that we're thinking about taking a first hay cut off it rather than grazing. East Hay Field first cut is already done. This would be the first time we've cut South for hay.",
      tags: ["hay", "pasture_check", "rainfall"],
    },
    {
      entry_date: "2023-07-08",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Cut South Pasture for hay today — first time we've ever done that. The dry conditions actually worked in our favor: bermuda mat was dense and stood up well for cutting. No rain forecast so we should be able to cure it without trouble. Hoping for 30–35 bales.",
      tags: ["hay", "pasture_check"],
    },
    {
      entry_date: "2023-07-14",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Baled South Pasture — got 31 round bales off it. Lower protein than the East Hay Field cut (about 7%) but it's dry-matter roughage and we'll take it. This was strictly a response to the drought; normally South is grazing-only. Between the 52 bales from East Hay Field first cut and these 31, we should be okay for winter if the dry weather keeps cutting into fall forage.",
      tags: ["hay"],
    },
    {
      entry_date: "2023-08-19",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Surprised by how fast South Pasture regrew after the July cut — we got just enough rain in early August (about 0.9 inches) and the bermuda bounced back. Decided to take a second cut off it today. The stand is thinner than the first cut but still worth baling. Dry year has pushed us into treating South as a dual-purpose pasture for the first time.",
      tags: ["hay", "rainfall"],
    },
    {
      entry_date: "2023-08-25",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Finished baling the second cut on South Pasture — 19 round bales. Combined with the first cut (31 bales) that's 50 bales off South this year, which we never expected. The drought forced our hand but it worked out. Won't make a habit of cutting South every year — the bermuda needs rest — but it's good to know it can handle a second cut if conditions line up.",
      tags: ["hay"],
    },

    // ---- March 2025 ----
    {
      entry_date: "2025-03-05",
      pasture_id: north,
      herd_group_id: null,
      content:
        "Walked the North Pasture today. Starting to see some green-up along the creek bottom. Ground is still pretty wet from snowmelt. Probably another two weeks before it can handle the herd.",
      tags: ["pasture_check"],
    },
    {
      entry_date: "2025-03-15",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "North pasture is greening up nicely after last week's rain. Ground is still soft in spots near the creek. Moved the cow-calf pairs out here today — plenty of forage to get started. Estimated about 0.6 inches of rain this week.",
      tags: ["rotation", "rainfall"],
    },
    {
      entry_date: "2025-03-22",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "First calf of the season hit the ground this morning. Heifer calf, looks strong. Mama is attentive. Keeping a close eye on two more cows that look close.",
      tags: ["calving"],
    },

    // ---- April 2025 ----
    {
      entry_date: "2025-04-03",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Three more calves this week — all healthy. Running total is four so far. Pairs are doing well on North Pasture. Grass is growing fast with the warm days and cool nights.",
      tags: ["calving", "pasture_check"],
    },
    {
      entry_date: "2025-04-14",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Had about 1.2 inches of rain over the weekend. North pasture looking lush. Moved pairs to the back section to let the front rest. Eight calves on the ground now.",
      tags: ["rainfall", "rotation", "calving"],
    },
    {
      entry_date: "2025-04-18",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Spring vaccination day. Ran all 32 cows through the chute — gave BVD, IBR, and PI3 combination vaccine plus a 7-way clostridial booster. Treated every animal with a pour-on dewormer at the same time. Good body condition across the board, most cows sitting around a 5.5 out of 9. Always a relief to get that done before breeding season.",
      tags: ["herd_health", "vaccination"],
    },
    {
      entry_date: "2025-04-28",
      pasture_id: west,
      herd_group_id: yearlings,
      content:
        "Put the yearling steers on West Bottom. Good forage down there and the creek is running well. Need to keep an eye on water levels — it can flood if we get a big rain.",
      tags: ["rotation"],
    },

    // ---- May 2025 ----
    {
      entry_date: "2025-05-06",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Calving season winding down — 28 calves total from 32 cows. Lost one calf to scours early on but the rest are growing well. Tagged and banded all the bull calves this weekend.",
      tags: ["calving", "herd_health"],
    },
    {
      entry_date: "2025-05-15",
      pasture_id: east,
      herd_group_id: null,
      content:
        "Cut the East Hay Field today. Beautiful stand of orchard grass and clover. Should get about 60 round bales off this cut. Weather looks dry for the next few days — perfect for curing.",
      tags: ["hay"],
    },
    {
      entry_date: "2025-05-22",
      pasture_id: east,
      herd_group_id: null,
      content:
        "Baled the East Hay Field — got 58 round bales. Tested at 11% protein which is great for this time of year. Stacked them in the barn. That should cover about 3 months of winter feeding.",
      tags: ["hay"],
    },
    {
      entry_date: "2025-05-30",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Moved cow-calf pairs to South Pasture. North needs a rest — they've been on it since mid-March. South is coming on strong with the warm-season grasses. About 0.4 inches of rain midweek.",
      tags: ["rotation", "rainfall"],
    },

    // ---- June 2025 ----
    {
      entry_date: "2025-06-02",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Turned the bull out with the cow-calf pairs today on South Pasture. Running a 60-day breeding season — he'll come out around August 1st. He's in good body condition, 5 out of 9. Last year he settled 30 of 32 so expectations are high. Keeping an eye on him the first few days to make sure he's on the job.",
      tags: ["herd_health", "breeding"],
    },
    {
      entry_date: "2025-06-08",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "South pasture at peak growth. Bermuda and crabgrass are thick. Cows are fat and happy. Calves are starting to nibble grass alongside their mamas.",
      tags: ["pasture_check"],
    },
    {
      entry_date: "2025-06-17",
      pasture_id: west,
      herd_group_id: yearlings,
      content:
        "Yearlings averaging about 650 lbs now. West Bottom forage is holding up well. Had a good rain — about 1.5 inches. Creek rose a bit but stayed in the banks.",
      tags: ["herd_health", "rainfall"],
    },
    {
      entry_date: "2025-06-25",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Rotated the pairs to the east side of South Pasture. West side gets a 14-day rest. Another 0.8 inches of rain. Total for June looking like around 3.5 inches — really good for us.",
      tags: ["rotation", "rainfall"],
    },

    // ---- July 2025 ----
    {
      entry_date: "2025-07-04",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Summer heat is on. South pasture starting to slow down. Grass is still adequate but not growing as fast. Put out mineral tubs for the cows.",
      tags: ["pasture_check", "supplement"],
    },
    {
      entry_date: "2025-07-15",
      pasture_id: north,
      herd_group_id: yearlings,
      content:
        "Moved yearlings from West Bottom up to North Pasture. West Bottom needs a break and North has recovered well after two months of rest. Fescue is tall but going to seed.",
      tags: ["rotation"],
    },
    {
      entry_date: "2025-07-22",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "South pasture is looking thin — classic summer slump. Grass barely above ankle height. Moving the herd back to North tomorrow. Going to rest South for at least 30 days.",
      tags: ["rotation", "herd_health"],
    },
    {
      entry_date: "2025-07-28",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Got the pairs settled on North Pasture. Only 0.3 inches of rain this month. Need to watch water levels in the stock tank. Yearlings sharing the pasture for now — plenty of room on 40 acres.",
      tags: ["rotation", "rainfall"],
    },

    // ---- August 2025 ----
    {
      entry_date: "2025-08-05",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Hot and dry. North pasture holding up better than South thanks to the creek. Cows are spending most of the afternoon in the shade. Calves are growing well — biggest ones probably pushing 350 lbs.",
      tags: ["herd_health", "pasture_check"],
    },
    {
      entry_date: "2025-08-10",
      pasture_id: null,
      herd_group_id: null,
      content:
        "Did a water check across all four pastures. The stock pond on North Pasture is down about 18 inches from its June level. The creek-fed tank on West Bottom is still holding up well. Had to fill the 1,500-gallon portable tank and haul it out to South Pasture — the cattle are drinking that dry in about 4 days in this heat. Need to monitor closely. No rain in two weeks and none in the forecast.",
      tags: ["pasture_check", "water"],
    },
    {
      entry_date: "2025-08-18",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Checked South Pasture — it's been resting 28 days now. Starting to see some recovery. Still crispy on the hilltops but the lower areas are greening. Only 0.5 inches of rain so far this month.",
      tags: ["pasture_check", "rainfall"],
    },
    {
      entry_date: "2025-08-25",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Pulled the bull out of the cow herd today — he was in for 83 days. Should be plenty of coverage. Separated him back into a small dry lot. Cows seem unbothered. Based on the breeding dates, first calves should arrive around mid-February 2026. Will schedule the fall pregnancy check with the vet for mid-November.",
      tags: ["herd_health", "breeding"],
    },
    {
      entry_date: "2025-08-30",
      pasture_id: null,
      herd_group_id: yearlings,
      content:
        "Weighed the yearling steers — averaging 740 lbs. On track for the 850 target by October. Started them on a protein supplement block to push gains through the summer slump.",
      tags: ["herd_health", "supplement"],
    },

    // ---- September 2025 ----
    {
      entry_date: "2025-09-06",
      pasture_id: east,
      herd_group_id: null,
      content:
        "Got the second cut off the East Hay Field. Smaller yield this time — 42 round bales. Protein tested a bit lower at 8.5%. Between the two cuts we've got 100 bales for winter. Should be enough.",
      tags: ["hay"],
    },
    {
      entry_date: "2025-09-15",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Nice rain this week — 1.8 inches. South Pasture has bounced back beautifully after the long rest. Moved cow-calf pairs back over. Fall green-up is underway.",
      tags: ["rainfall", "rotation"],
    },
    {
      entry_date: "2025-09-24",
      pasture_id: west,
      herd_group_id: yearlings,
      content:
        "Moved yearlings to West Bottom for finishing. Plenty of lush fall grass down there. Creek is flowing again after the rain. These steers should hit target weight by mid-October.",
      tags: ["rotation"],
    },

    // ---- October 2025 ----
    {
      entry_date: "2025-10-01",
      pasture_id: north,
      herd_group_id: null,
      content:
        "Applied nitrogen fertilizer to North Pasture today — 50 lbs per acre of urea spread across all 40 acres. Cost $210 for the fertilizer. Rain is forecast for later this week which should help it soak in. The plan is to stockpile this fescue through October and November so we can strip-graze it in January or February when hay gets tight. Did not fertilize South or West Bottom this fall.",
      tags: ["pasture_check", "fertilizer"],
    },
    {
      entry_date: "2025-10-08",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Weaned the calves today. Stressful day but it went smooth. Calves are in the corral bawling. Cows are in South Pasture looking confused. Average weaning weight 480 lbs — really pleased with that.",
      tags: ["calving", "herd_health"],
    },
    {
      entry_date: "2025-10-12",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Pre-weaning vaccination day. Ran all 28 calves through the chute and gave each one a 7-way clostridial shot and a modified-live respiratory combo vaccine (BVD, IBR, BRSV, PI3). Also gave the 32 cows their annual fall booster. 60 animals total through the chute — took about 3 hours with the help of one hand. Calves handled it well. Much less stress doing it before weaning than trying to sort and vaccinate on the same day.",
      tags: ["herd_health", "vaccination"],
    },
    {
      entry_date: "2025-10-16",
      pasture_id: west,
      herd_group_id: yearlings,
      content:
        "Sold the yearling steers — 15 head averaging 855 lbs. Good price at the sale barn. $2.12/lb. That's about $27,180 gross. They did well on grass alone plus the supplement blocks.",
      tags: ["herd_health"],
    },
    {
      entry_date: "2025-10-25",
      pasture_id: north,
      herd_group_id: null,
      content:
        "Frost last night. North Pasture fescue is still green — it handles cold well. Starting to think about stockpiling strategy. Going to let the fescue grow tall and save it for late-winter grazing.",
      tags: ["pasture_check"],
    },

    // ---- November 2025 ----
    {
      entry_date: "2025-11-05",
      pasture_id: north,
      herd_group_id: null,
      content:
        "North Pasture fescue stockpile is looking great — knee high and dense. Applied 50 lbs/acre of nitrogen last month and it really helped. This should carry the cows through January if we manage it right.",
      tags: ["pasture_check", "supplement"],
    },
    {
      entry_date: "2025-11-15",
      pasture_id: south,
      herd_group_id: cowCalf,
      content:
        "Cows are cleaning up the last of the South Pasture. Starting to supplement with hay — about 2 round bales per week. The weaned calves are settled down and eating well in the feedlot area.",
      tags: ["hay", "rotation"],
    },
    {
      entry_date: "2025-11-18",
      pasture_id: west,
      herd_group_id: null,
      content:
        "Spent the afternoon repairing fence on the south end of West Bottom. Spring flooding had undermined a corner post and a 60-foot section of 4-strand barbed wire sagged into the creek. Reset the corner post with concrete, re-stretched the wire, and drove 8 new T-posts where the soil eroded. Also walked the full perimeter while I was down there — the rest of the fence is in decent shape. This section had been on the to-do list since April. Glad to have it done before hard freeze.",
      tags: ["maintenance"],
    },
    {
      entry_date: "2025-11-28",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Vet came out for fall pregnancy check. 30 of 32 cows confirmed bred. Two open cows will go to the sale barn in December. Good repro rate for the year. Bull did his job.",
      tags: ["herd_health"],
    },

    // ---- December 2025 ----
    {
      entry_date: "2025-12-08",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Started full winter feeding today. Putting out 4 round bales per week for the cow-calf pairs. Hay tested at 9% protein — decent but might need to supplement with a mineral tub.",
      tags: ["hay", "supplement"],
    },
    {
      entry_date: "2025-12-18",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Cold snap — dropped to 12°F last night. Stock tank heater is earning its keep. Cows are eating more hay in this cold. Bumped up to 5 bales this week. Everyone looks healthy though.",
      tags: ["hay", "herd_health"],
    },
    {
      entry_date: "2025-12-28",
      pasture_id: north,
      herd_group_id: null,
      content:
        "Checked the stockpiled fescue on North Pasture. Still holding up — about 8 inches of standing forage under the frost. Planning to strip-graze it starting mid-January to stretch it out.",
      tags: ["pasture_check"],
    },

    // ---- January 2026 ----
    {
      entry_date: "2026-01-06",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Heavy feeding period. Going through 6 round bales per week now. At this rate, our 100-bale supply will last until mid-March. That should be enough to get us to spring green-up.",
      tags: ["hay"],
    },
    {
      entry_date: "2026-01-10",
      pasture_id: null,
      herd_group_id: null,
      content:
        "Ran a hay inventory today. Used 38 bales since we started feeding December 1st. That leaves us 62 bales. At 6 per week we have about 10 weeks — takes us to mid-March. Could be tight depending on how late spring comes. Asked the Johnson place about buying extra hay if needed — they quoted $45 per bale for 4x5 round bales of mixed grass. Also picked up 4 bags of loose cattle mineral at the co-op, $28 per bag, 50 lbs each. Mineral program is just straight calcium-phosphorus with trace minerals — nothing fancy.",
      tags: ["hay", "supplement"],
    },
    {
      entry_date: "2026-01-14",
      pasture_id: north,
      herd_group_id: cowCalf,
      content:
        "Started strip-grazing the stockpiled fescue on North Pasture. Put up temporary electric fence to give them a 3-acre strip. They cleaned it up in 4 days. This is saving us about 2 bales per week.",
      tags: ["rotation", "hay"],
    },
    {
      entry_date: "2026-01-20",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Vet check on the pregnant cows. Everything looks good. Most should start calving mid-February. Got the calving barn cleaned out and ready. Stocked up on OB supplies.",
      tags: ["herd_health", "calving"],
    },
    {
      entry_date: "2026-01-28",
      pasture_id: null,
      herd_group_id: null,
      content:
        "Got about 4 inches of snow overnight. Roads are slick. Fed the cows in the sheltered area by the barn. Everybody accounted for. Looking forward to spring.",
      tags: ["rainfall"],
    },

    // ---- February 2026 ----
    {
      entry_date: "2026-02-05",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "Pre-calving prep in full swing. Sorted the heaviest cows into the calving pasture near the barn. They should start dropping calves in the next week or two. Bedded the barn with fresh straw.",
      tags: ["calving"],
    },
    {
      entry_date: "2026-02-10",
      pasture_id: null,
      herd_group_id: null,
      content:
        "Got 0.6 inches of rain overnight. First real rain of February — been mostly dry this month. Ground is soft but not muddy. The stock ponds are holding steady.",
      tags: ["rainfall"],
    },
    {
      entry_date: "2026-02-14",
      pasture_id: north,
      herd_group_id: null,
      content:
        "Checked North Pasture — the stockpiled fescue is almost grazed out. But I can see new green shoots coming up underneath. Spring is on the way. Cut back hay to 4 bales per week.",
      tags: ["pasture_check", "hay"],
    },
    {
      entry_date: "2026-02-22",
      pasture_id: null,
      herd_group_id: cowCalf,
      content:
        "First calf of 2026 born yesterday evening! Bull calf, big and healthy. Two more cows look close. Here we go again. Planning to keep feeding hay until the grass is 6 inches and growing strong.",
      tags: ["calving"],
    },
    {
      entry_date: "2026-02-25",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Another 0.4 inches of rain this morning. Total rainfall for February is about 1 inch so far. Not great but better than last February. Hoping for one more good rain before March.",
      tags: ["rainfall"],
    },
    {
      entry_date: "2026-02-28",
      pasture_id: south,
      herd_group_id: null,
      content:
        "Walked all the pastures today to assess winter damage. South Pasture has some bare spots that need attention — might overseed in March. West Bottom looks good. North is recovering from the strip grazing. East Hay Field is dormant but should come on strong once it warms up.",
      tags: ["pasture_check"],
    },
  ];
}

// ---------- POST handler ----------

export async function POST() {
  // 1. Authenticate the user via the anon-key server client
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = user.id;

  // 2. Check if user already has diary entries
  const { count } = await supabase
    .from("diary_entries")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "You already have diary entries. Seed is only for empty accounts.",
      },
      { status: 409 },
    );
  }

  // 3. Use admin client (bypasses RLS) for inserts
  const admin = createAdminClient();

  // 4. Upsert profile with ranch name (creates the row if the trigger missed it)
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: profileId, ranch_name: "Dry Creek Ranch" });

  if (profileError) {
    return NextResponse.json(
      { error: `Failed to update profile: ${profileError.message}` },
      { status: 500 },
    );
  }

  // 5. Insert pastures
  const { data: insertedPastures, error: pastureError } = await admin
    .from("pastures")
    .insert(pastures.map((p) => ({ ...p, profile_id: profileId })))
    .select("id, name");

  if (pastureError || !insertedPastures) {
    return NextResponse.json(
      { error: `Failed to insert pastures: ${pastureError?.message}` },
      { status: 500 },
    );
  }

  const pastureIds: IdMap = Object.fromEntries(
    insertedPastures.map((p) => [p.name, p.id]),
  );

  // 6. Insert herd groups
  const { data: insertedHerds, error: herdError } = await admin
    .from("herd_groups")
    .insert(herdGroups.map((h) => ({ ...h, profile_id: profileId })))
    .select("id, name");

  if (herdError || !insertedHerds) {
    return NextResponse.json(
      { error: `Failed to insert herd groups: ${herdError?.message}` },
      { status: 500 },
    );
  }

  const herdIds: IdMap = Object.fromEntries(
    insertedHerds.map((h) => [h.name, h.id]),
  );

  // 7. Insert diary entries
  const entries = buildDiaryEntries(pastureIds, herdIds);
  const { data: insertedEntries, error: entryError } = await admin
    .from("diary_entries")
    .insert(
      entries.map((e) => ({
        ...e,
        profile_id: profileId,
      })),
    )
    .select("id");

  if (entryError || !insertedEntries) {
    return NextResponse.json(
      { error: `Failed to insert diary entries: ${entryError?.message}` },
      { status: 500 },
    );
  }

  // 8. Generate embeddings for all diary entries so RAG chat works
  // Build the reverse lookup maps: id → name
  const pastureNameById: Record<
    string,
    { name: string; acres: number | null }
  > = Object.fromEntries(
    insertedPastures.map((p) => [
      p.id,
      {
        name: p.name,
        acres: pastures.find((pd) => pd.name === p.name)?.acres ?? null,
      },
    ]),
  );
  const herdNameById: Record<
    string,
    { name: string; head_count: number | null }
  > = Object.fromEntries(
    insertedHerds.map((h) => [
      h.id,
      {
        name: h.name,
        head_count:
          herdGroups.find((hd) => hd.name === h.name)?.head_count ?? null,
      },
    ]),
  );

  // Build content_for_rag strings for each entry
  const ragTexts = entries.map((e) => {
    const pasture = e.pasture_id ? pastureNameById[e.pasture_id] : null;
    const herd = e.herd_group_id ? herdNameById[e.herd_group_id] : null;
    return formatEntryForRag({
      entry_date: e.entry_date,
      content: e.content,
      pasture_name: pasture?.name ?? null,
      acres: pasture?.acres ?? null,
      herd_group_name: herd?.name ?? null,
      head_count: herd?.head_count ?? null,
      tags: e.tags,
    });
  });

  try {
    // Batch embed all entries at once
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: ragTexts,
    });

    // Insert embeddings
    const embeddingRows = insertedEntries.map((entry, i) => ({
      entry_id: entry.id,
      profile_id: profileId,
      content_for_rag: ragTexts[i],
      embedding: embeddings[i] as unknown as string,
    }));

    const { error: embedError } = await admin
      .from("entry_embeddings")
      .insert(embeddingRows);

    if (embedError) {
      console.error("[seed] Failed to insert embeddings:", embedError.message);
      // Don't fail the whole seed — entries are still usable without embeddings
    }
  } catch (err) {
    console.error("[seed] Embedding generation failed:", err);
    // Non-fatal: seed data is still useful without embeddings
  }

  return NextResponse.json({
    success: true,
    seeded: {
      pastures: insertedPastures.length,
      herdGroups: insertedHerds.length,
      diaryEntries: insertedEntries.length,
    },
  });
}

// ---------- DELETE handler — Remove seed / demo data ----------

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = user.id;
  const admin = createAdminClient();

  // Delete in order respecting foreign keys:
  // entry_embeddings cascade from diary_entries, so just delete diary_entries first
  const { error: entriesErr } = await admin
    .from("diary_entries")
    .delete()
    .eq("profile_id", profileId);

  if (entriesErr) {
    return NextResponse.json(
      { error: `Failed to delete diary entries: ${entriesErr.message}` },
      { status: 500 },
    );
  }

  // Delete weekly reviews
  await admin.from("weekly_reviews").delete().eq("profile_id", profileId);

  // Delete herd groups
  const { error: herdsErr } = await admin
    .from("herd_groups")
    .delete()
    .eq("profile_id", profileId);

  if (herdsErr) {
    return NextResponse.json(
      { error: `Failed to delete herd groups: ${herdsErr.message}` },
      { status: 500 },
    );
  }

  // Delete pastures
  const { error: pasturesErr } = await admin
    .from("pastures")
    .delete()
    .eq("profile_id", profileId);

  if (pasturesErr) {
    return NextResponse.json(
      { error: `Failed to delete pastures: ${pasturesErr.message}` },
      { status: 500 },
    );
  }

  // Reset ranch name
  await admin.from("profiles").update({ ranch_name: null }).eq("id", profileId);

  return NextResponse.json({ success: true });
}
