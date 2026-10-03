import { socials } from "@/data/socials";

export default function ContactSection() {
  return (
    <section className="contact-section">
      <p className="intro-name">get in touch</p>
      <div className="social-links">
        {socials.map((social, index) => (
          <span key={social.name}>
            <a
              href={social.href}
              {...(social.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {social.name}
            </a>
            {index < socials.length - 1 && <span aria-hidden> / </span>}
          </span>
        ))}
      </div>
    </section>
  );
}
