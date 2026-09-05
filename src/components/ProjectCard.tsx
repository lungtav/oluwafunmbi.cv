import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

type ProjectCardProps = {
  name: string;
  description: string;
  link: string;
  /** Shown as the link text; defaults to the link itself. */
  linkLabel?: string;
  /** Position in the work list, used for the ghost index number. */
  index: number;
  /** Optional app screenshot, framed inside the preview. */
  image?: string;
};

export default function ProjectCard({
  name,
  description,
  link,
  linkLabel,
  index,
  image,
}: ProjectCardProps) {
  return (
    <article className="group">
      {/* Preview */}
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-[16/10] overflow-hidden rounded-xl border border-line bg-gradient-to-br from-card-hi to-card-lo transition-all duration-500 group-hover:-translate-y-1 group-hover:border-accent/40 group-hover:shadow-[0_18px_40px_-18px_rgba(74,120,86,0.22)]"
      >
        <div className="dot-grid absolute inset-0 opacity-70 transition-transform duration-700 group-hover:scale-[1.04]" />

        <span
          aria-hidden
          className="absolute left-5 top-3 font-display text-7xl leading-none text-ink/[0.07] transition-colors duration-500 group-hover:text-accent/25"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* App screenshot — inset so the backdrop stays visible around it. */}
        {image ? (
          <div className="absolute inset-x-7 top-9 bottom-0 overflow-hidden rounded-t-lg border border-b-0 border-line bg-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:-translate-y-1.5">
            <img
              src={image}
              alt={`${name} app preview`}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        ) : (
          <>
            {/* Ghost wordmark fills cards that have no screenshot yet. */}
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pb-4 font-display text-6xl leading-none text-ink/[0.07] transition-colors duration-500 group-hover:text-accent/25"
            >
              {name}
            </span>

            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.28em] text-placeholder-ink">
              Project Preview
            </span>
          </>
        )}

        <span className="absolute right-4 top-4 flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-paper text-ink opacity-0 shadow-[0_4px_14px_rgba(35,38,35,0.16)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRightIcon className="h-4 w-4" />
        </span>
      </a>

      {/* Details */}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] font-medium text-ink-soft">{name}</h3>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="link-underline shrink-0 font-mono text-[11px] tracking-[0.04em] text-accent-ink"
        >
          {linkLabel ?? link}
        </a>
      </div>

      <p className="mt-1.5 max-w-lg text-[13px] leading-6 text-subtle">
        {description}
      </p>
    </article>
  );
}
