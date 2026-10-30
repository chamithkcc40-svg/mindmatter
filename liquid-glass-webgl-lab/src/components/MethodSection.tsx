const ROWS: { title: string; formula: string; body: string }[] = [
  {
    title: "Two-pass pipeline",
    formula: "env → FBO → displaced sampling",
    body: "The environment is rendered procedurally into an offscreen framebuffer every frame. The glass pass then samples that texture at coordinates displaced by the refracted ray direction — producing true spatial distortion of background features, never a blur substitute.",
  },
  {
    title: "Refraction",
    formula: "refract(I, N, 1/η)",
    body: "GLSL's Snell refraction of the view vector against per-pixel surface normals, projected to screen space and scaled by apparent thickness. A single-bounce approximation — no internal multi-bounce or photon transport is simulated.",
  },
  {
    title: "Fresnel edges",
    formula: "F = F₀ + (1−F₀)(1−N·V)⁵",
    body: "Schlick's approximation blends transmission into a procedural studio reflection. The lens rim brightens at grazing angles; F₀, reflection gain and edge falloff are all live parameters.",
  },
  {
    title: "Absorption",
    formula: "T = e^(−σ·d)",
    body: "Beer–Lambert attenuation along an apparent optical path (thicker crown, longer grazing rays). Per-channel σ gives true transmission tinting — smoked and cool glass are coloured by physics-style subtraction, not overlay.",
  },
  {
    title: "Dispersion",
    formula: "ηᵣ ≠ η𝓰 ≠ ηᵦ",
    body: "Chromatic aberration evaluates the refraction offset with slightly different indices per channel. Restrained by design, scales with refraction strength, and can be switched off entirely.",
  },
  {
    title: "Rough transmission",
    formula: "Σ poisson taps / k",
    body: "The frosted preset approximates microfacet transmission with a fixed Poisson-disc mean of the captured environment. It is a screen-space estimate of scattering — honest, and labelled as such.",
  },
];

export default function MethodSection() {
  return (
    <section className="border-t border-[var(--line-soft)]">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10">
          <p className="micro-label mb-3 flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-[var(--accent)]" />
            Optics, honestly
          </p>
          <h2 className="display-tight max-w-xl text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            Physically inspired, openly approximated.
          </h2>
        </div>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {ROWS.map((r) => (
            <div key={r.title} className="border-t border-[var(--line)] pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[0.8125rem] font-semibold tracking-wide text-[var(--ink)]">
                  {r.title}
                </h3>
                <span className="mono shrink-0 text-[0.625rem] text-[var(--accent-ink)]">
                  {r.formula}
                </span>
              </div>
              <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--ink-2)]">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
