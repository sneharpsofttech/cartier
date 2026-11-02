import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import StepBar from "@/components/steps/StepBar";
import { CLARITIES, COLORS, CUTS, STONE_TYPE_LABELS } from "@/lib/diamonds/grades";
import { reviewUrl, selectStoneUrl, settingUrl, stoneListUrl } from "@/lib/diamonds/ring";
import { getStone } from "@/lib/diamonds/store";
import { formatPrice, stoneTitle, type Stone } from "@/lib/diamonds/types";
import { getSetting } from "@/lib/settings/catalog";
import styles from "./page.module.css";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ring?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stone = getStone((await params).id);
  return { title: stone ? `${stoneTitle(stone)} · DAZORA` : "Stone not found" };
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One line on what each grade means, shown under its scale. */
const COLOR_NOTE: Record<string, string> = {
  D: "Colourless: the rarest and most icy white.",
  E: "Colourless: no colour visible even to an expert.",
  F: "Colourless: only a gemologist sees a trace.",
  G: "Near colourless: looks white face-up.",
  H: "Near colourless: white to the eye, great value.",
  I: "Near colourless: a faint warmth, lovely in yellow gold.",
  J: "Near colourless: slight warmth, best value.",
};
const CLARITY_NOTE: Record<string, string> = {
  FL: "Flawless: nothing visible even under 10× magnification.",
  IF: "Internally flawless: no inclusions under magnification.",
  VVS1: "Very, very slightly included: extremely hard to see at 10×.",
  VVS2: "Very, very slightly included: extremely hard to see at 10×.",
  VS1: "Very slightly included: clean to the eye.",
  VS2: "Very slightly included: clean to the eye.",
  SI1: "Slightly included: usually clean to the eye.",
  SI2: "Slightly included: marks may show on close look.",
  SI3: "Slightly included: marks may be visible.",
  I1: "Included: marks visible to the eye.",
};
const CUT_NOTE: Record<string, string> = {
  Ideal: "Cut for maximum brilliance and fire.",
  Excellent: "Superb light return and sparkle.",
  "Very Good": "Bright, lively sparkle at a gentler price.",
  Good: "Good light return, an excellent value choice.",
};

type Row = [string, string | null];
const rows = (r: Row[]) => r.filter((x): x is [string, string] => x[1] !== null);

/** Details grouped as on a grading report: the grades, the proportions, the paperwork. */
function detailGroups(s: Stone) {
  return [
    {
      title: "Grading",
      rows: rows([
        ["Colour", s.gem ? s.gem.variety : s.fancy ? `${s.fancy.intensity} ${s.fancy.color}` : s.color],
        ["Clarity", s.clarity],
        ["Cut", s.cut],
        ["Polish", s.polish],
        ["Symmetry", s.symmetry],
        ["Fluorescence", s.fluorescence],
        ["Hearts & Arrows", s.type === "gemstone" ? null : s.heartsArrows ? "Yes" : "No"],
      ]),
    },
    {
      title: "Measurements",
      rows: rows([
        ["Carat weight", `${s.carat.toFixed(2)} ct`],
        ["Dimensions", `${s.measurements.map((m) => m.toFixed(2)).join(" × ")} mm`],
        ["Length / width", s.ratio.toFixed(2)],
        ["Depth", `${s.depthPct.toFixed(1)}%`],
        ["Table", `${s.tablePct.toFixed(1)}%`],
      ]),
    },
    {
      title: "Certificate",
      rows: rows([
        ["Laboratory", s.lab],
        ["Report number", s.certificate],
        ["Stock number", s.id],
        ["Type", STONE_TYPE_LABELS[s.type].replace(/s$/, "")],
        ["Shape", titleCase(s.shape)],
        ["Origin", s.gem?.origin ?? null],
        ["Treatment", s.gem?.treatment ?? null],
      ]),
    },
  ];
}

export default async function StonePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { ring = "" } = await searchParams;
  const stone = getStone(id);
  if (!stone) notFound();

  const ringParams = new URLSearchParams(ring);
  const setting = ringParams.get("setting") ? getSetting(ringParams.get("setting")!) : null;
  const select = selectStoneUrl(stone, ring);
  const backToList = stoneListUrl(ring, { diamond_type: stone.type, ...(stone.fancy ? { color_type: "Fancy" } : {}) });
  const kind = stone.type === "gemstone" ? "gemstone" : "diamond";
  const typeLabel = STONE_TYPE_LABELS[stone.type].replace(/s$/, "");
  const [length, width] = stone.measurements;

  const withStone = new URLSearchParams(ring);
  withStone.set("stone", stone.id);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <StepBar
          current={0}
          steps={[
            { label: "Choose stone", detail: stoneTitle(stone), href: backToList },
            {
              label: "Choose setting",
              detail: setting ? `The ${setting.name}` : undefined,
              href: setting ? settingUrl(setting.slug, ringParams) : `/settings?stone=${stone.id}`,
            },
            { label: "Review", href: setting ? reviewUrl(withStone.toString()) : undefined },
          ]}
        />

        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={backToList}>{STONE_TYPE_LABELS[stone.type]}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{stoneTitle(stone)}</span>
        </nav>

        <div className={styles.layout}>
          {/* ---------- Picture ---------- */}
          <div className={styles.media}>
            <div className={styles.stage}>
              <span className={styles.badges}>
                <span>{stone.lab} certified</span>
                {stone.heartsArrows && stone.type !== "gemstone" && <span>Hearts &amp; Arrows</span>}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stone.image} alt={stoneTitle(stone)} />
            </div>
            <div className={styles.mediaFoot}>
              <span>
                Face-up size <strong>{length.toFixed(2)} × {width.toFixed(2)} mm</strong>
              </span>
              <span>Representative 3D render of this shape and colour</span>
            </div>
          </div>

          {/* ---------- Words, grades and the button ---------- */}
          <div className={styles.info}>
            <p className={styles.kicker}>{typeLabel}</p>
            <h1 className={styles.title}>{stoneTitle(stone)}</h1>
            <p className={styles.meta}>
              Stock {stone.id} · {stone.lab} report {stone.certificate}
            </p>

            <div className={styles.priceRow}>
              <p className={styles.price}>{formatPrice(stone.price)}</p>
              <p className={styles.priceNote}>Loose {kind} · setting priced separately</p>
            </div>

            <div className={styles.grades}>
              <Grade label="Carat" value={`${stone.carat.toFixed(2)} ct`} note={`About ${length.toFixed(1)} mm across.`} />
              {stone.color && (
                <Grade label="Colour" value={stone.color} scale={COLORS} note={COLOR_NOTE[stone.color]} />
              )}
              {stone.fancy && (
                <Grade label="Colour" value={`${stone.fancy.intensity} ${stone.fancy.color}`} note="A naturally coloured diamond." />
              )}
              {stone.gem && <Grade label="Variety" value={stone.gem.variety} note={`From ${stone.gem.origin}.`} />}
              {stone.clarity && (
                <Grade label="Clarity" value={stone.clarity} scale={CLARITIES} note={CLARITY_NOTE[stone.clarity]} />
              )}
              {stone.cut && <Grade label="Cut" value={stone.cut} scale={CUTS} note={CUT_NOTE[stone.cut]} />}
            </div>

            <div className={styles.actions}>
              <Link href={select} className={styles.primary}>
                Select this {kind}
              </Link>
              <Link href={backToList} className={styles.secondary}>
                Compare similar
              </Link>
            </div>
            <p className={styles.next}>
              {setting
                ? `Next: see it in the ${setting.name} setting, in 3D.`
                : "Next: choose a setting, then see your ring in 3D."}
            </p>

            <ul className={styles.promises}>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="9" r="6" />
                  <path d="m9.5 9 1.7 1.7L14.6 7.4M8.5 14l-1.5 7 5-2.5 5 2.5-1.5-7" />
                </svg>
                <span>
                  <strong>{stone.lab} certified</strong>
                  Report included
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
                <span>
                  <strong>Free shipping</strong>
                  Fully insured
                </span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                </svg>
                <span>
                  <strong>30-day returns</strong>
                  No questions asked
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ---------- Full details ---------- */}
        <section className={styles.details} aria-labelledby="details-title">
          <div className={styles.detailsHead}>
            <p className={styles.kicker}>The grading report</p>
            <h2 id="details-title">Stone Details</h2>
          </div>
          <div className={styles.groups}>
            {detailGroups(stone).map((g) => (
              <div key={g.title} className={styles.group}>
                <h3>{g.title}</h3>
                <dl>
                  {g.rows.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A grade card: the grade, where it sits on its scale (best on the left) and what it means. */
function Grade({
  label,
  value,
  scale,
  note,
}: {
  label: string;
  value: string;
  scale?: readonly string[];
  note?: string;
}) {
  return (
    <div className={styles.grade}>
      <div className={styles.gradeHead}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {scale && (
        <ol className={styles.scale} aria-label={`${label} scale`}>
          {scale.map((s) => (
            <li key={s} data-on={s === value || undefined} title={s} />
          ))}
        </ol>
      )}
      {scale && (
        <div className={styles.scaleEnds} aria-hidden="true">
          <span>{scale[0]}</span>
          <span>{scale[scale.length - 1]}</span>
        </div>
      )}
      {note && <p className={styles.gradeNote}>{note}</p>}
    </div>
  );
}
