import { createFileRoute } from "@tanstack/react-router";
import { Search, Star, ArrowRight, TrendingUp, Video, Users, Award, Facebook, Instagram, Linkedin, Apple, Play } from "lucide-react";
import tutor1 from "@/assets/tutor1.jpg";
import tutor2 from "@/assets/tutor2.jpg";
import tutor3 from "@/assets/tutor3.jpg";
import tutor4 from "@/assets/tutor4.jpg";
import review1 from "@/assets/review1.jpg";
import review2 from "@/assets/review2.jpg";
import review3 from "@/assets/review3.jpg";
import review4 from "@/assets/review4.jpg";
import onlineLessons from "@/assets/online-lessons.jpg";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "SpedCentral — Find Expert Tutors Online" },
      { name: "description", content: "SpedCentral connects students with 60,000+ expert tutors across 300+ subjects." },
    ],
  }),
});

const trending = ["Calculus", "Cosmology", "Elementary Science", "Geography", "Linguistics", "LSAT", "MCAT", "SAT Math", "SAT Reading"];

const reviews = [
  { title: "The Top 1% of All Tutors I've Had", body: "We've had some amazing tutors, and Ethan is at the top. He has lots of time for you, even outside of tutoring time, and he explains to you the coding concepts as y'all work through it. He's worth every cent.", name: "Mark, 5 lessons with Ethan", subject: "SAT Prep Tutor", img: review1, tint: "bg-[oklch(0.97_0.03_45)]", accent: "text-brand-orange" },
  { title: "AMAZING TUTOR", body: "Tiffany has exceeded our expectations. She is knowledgeable, patient, and fun. All the lessons are thoughtfully prepared. She has such a great personality. Our 5-year-old son enjoys every lesson with her and he is actually engaged for the whole hour.", name: "Joanna, 10 lessons with Tiffany", subject: "Elementary Reading Tutor", img: review2, tint: "bg-[oklch(0.96_0.03_240)]", accent: "text-[oklch(0.55_0.2_240)]" },
  { title: "Great tutor", body: "My son is a high school sophomore, and Danny has been struggling with Geometry. Danny has been a great geometry tutor for my son. He went from D to B in one quarter. Very happy with Danny.", name: "Debra, 8 lessons with Danny", subject: "Geometry Tutor", img: review3, tint: "bg-[oklch(0.97_0.03_140)]", accent: "text-[oklch(0.5_0.18_140)]" },
  { title: "Wonderful tutor", body: "Mikayla is an amazing tutor! She is extremely knowledgeable and patient to boot. I needed to find a tutor with that exact combo and she totally fits the bill to a tee. Now I'm looking forward to working with my daughter after she lays the groundwork for my son's essay writing!", name: "Sydney, 10 lessons with Mikayla", subject: "Writing Tutor", img: review4, tint: "bg-[oklch(0.96_0.03_240)]", accent: "text-[oklch(0.55_0.2_240)]" },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rotate-45 bg-brand-orange" />
      <span className={`text-xl font-bold tracking-tight ${dark ? "text-white" : "text-brand-dark"}`}>
        sped<span className="text-brand-orange">Central</span>
      </span>
    </div>
  );
}

function Diamond({ src, className = "", alt }: { src: string; className?: string; alt: string }) {
  return (
    <div className={`overflow-hidden rotate-45 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full -rotate-45 scale-150 object-cover" />
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="bg-brand-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Logo dark />
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="font-semibold text-white/90 hover:text-white">LOG IN</a>
            <a href="#" className="rounded border border-brand-green px-4 py-1.5 font-semibold text-brand-green hover:bg-brand-green hover:text-brand-dark">SIGN UP</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 md:grid-cols-[1fr_2fr_1fr]">
          {/* Left diamonds */}
          <div className="relative hidden h-[420px] md:block">
            <div className="absolute left-0 top-0 h-24 w-24 rotate-45 bg-brand-orange" />
            <Diamond src={tutor1} alt="Tutor" className="absolute left-16 top-8 h-40 w-40" />
            <div className="absolute -left-4 top-40 h-16 w-16 rotate-45 bg-brand-green" />
            <Diamond src={tutor3} alt="Tutor" className="absolute left-10 top-52 h-36 w-36" />
            <div className="absolute left-40 top-72 h-12 w-12 rotate-45 bg-brand-yellow" />
          </div>

          {/* Center */}
          <div className="text-center">
            <h1 className="text-4xl font-black leading-tight text-brand-dark md:text-5xl">
              Trust the nation's largest<br />network for <span className="text-highlight">Calculus</span> tutors
            </h1>
            <div className="mx-auto mt-8 flex max-w-xl overflow-hidden rounded-md border border-border bg-white shadow-sm">
              <input placeholder="What would you like to learn?" className="w-full px-4 py-3 text-sm outline-none" />
              <button className="bg-brand-orange px-5 text-white hover:opacity-90"><Search className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-brand-green"><TrendingUp className="h-3 w-3" /> Trending:</span>
              {trending.map((t) => (
                <a key={t} href="#" className="rounded-full border border-border bg-white px-3 py-1 text-brand-dark hover:border-brand-orange">{t}</a>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 text-sm text-brand-dark sm:grid-cols-3">
              <div><div className="flex items-center justify-center gap-1 text-brand-orange"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>More than <b>4 million</b><br />5-star reviews</div>
              <div><div className="text-brand-orange">◆ ◆</div><b>65,000 expert tutors</b><br />in 300+ subjects</div>
              <div><div className="text-brand-orange">◆ ◆</div>Find a great match with our<br /><b className="text-brand-green">Good Fit Guarantee</b></div>
            </div>
          </div>

          {/* Right diamonds */}
          <div className="relative hidden h-[420px] md:block">
            <Diamond src={tutor2} alt="Tutor" className="absolute right-16 top-0 h-40 w-40" />
            <div className="absolute right-0 top-16 h-16 w-16 rotate-45 bg-brand-yellow" />
            <div className="absolute right-40 top-32 h-20 w-20 rotate-45 bg-brand-orange" />
            <Diamond src={tutor4} alt="Student" className="absolute right-8 top-56 h-36 w-36" />
            <div className="absolute right-40 top-72 h-16 w-16 rotate-45 bg-brand-green" />
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="border-b border-border bg-white py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-muted-foreground">Tutors from top universities</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-serif italic text-brand-dark opacity-70">
            <span className="font-black not-italic">MIT</span>
            <span className="font-bold not-italic tracking-widest">HARVARD</span>
            <span className="font-serif">Columbia University</span>
            <span className="font-bold not-italic italic">Juilliard</span>
            <span className="font-bold not-italic text-[oklch(0.6_0.2_50)]">Caltech</span>
            <span className="font-bold not-italic tracking-wide">PRINCETON</span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold text-brand-dark">Finding the perfect tutor is easy</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { step: "Step 1", title: "CHOOSE YOUR TUTOR" },
              { step: "Step 2", title: "SHARE YOUR GOALS" },
              { step: "Step 3", title: "BOOK YOUR LESSON" },
            ].map((s) => (
              <div key={s.step} className="rounded-lg border border-border bg-white p-6 text-left shadow-sm">
                <p className="text-sm font-semibold text-brand-green">{s.step}</p>
                <h3 className="mt-2 text-lg font-bold text-brand-dark">{s.title}</h3>
                <div className="mt-6 flex h-32 items-center justify-center rounded bg-cream text-muted-foreground">
                  <div className="h-20 w-full rounded bg-white shadow-inner" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-12 text-xl font-semibold text-brand-dark">The right fit, or it's free.</p>
          <p className="mt-2 text-sm text-muted-foreground">We're so confident you'll find a great match, we guarantee your first hour with any new tutor.</p>
          <button className="mt-6 rounded-md bg-brand-orange px-8 py-3 font-semibold text-white hover:opacity-90">Sign up now</button>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-dark">Your next great tutor</h2>
            <p className="mt-2 text-sm text-muted-foreground">Enjoy one-on-one instruction from the nation's biggest network of independent experts.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.name} className={`flex gap-4 rounded-lg p-6 ${r.tint}`}>
                <img src={r.img} alt={r.name} loading="lazy" width={80} height={80} className="h-20 w-20 flex-shrink-0 rounded-full object-cover" />
                <div>
                  <h3 className={`text-sm font-bold ${r.accent}`}>❝ {r.title}</h3>
                  <p className="mt-2 text-sm text-brand-dark/80">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.name}</p>
                  <p className={`mt-1 text-sm font-semibold ${r.accent}`}>{r.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Online lessons */}
      <section className="relative overflow-hidden">
        <img src={onlineLessons} alt="Online tutoring" loading="lazy" width={1600} height={700} className="h-[420px] w-full object-cover" />
        <div className="absolute inset-0 bg-brand-dark/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-white">
            <h2 className="text-3xl font-bold md:text-4xl">
              Online lessons.<br /><span className="text-highlight text-brand-dark">Real-world results.</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: <Video className="h-5 w-5" />, num: "12+ million", label: "Lessons" },
                { icon: <Users className="h-5 w-5" />, num: "3+ million", label: "Students" },
                { icon: <Award className="h-5 w-5" />, num: "4.9", label: "Average rating" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-brand-dark">
                  <span className="text-brand-orange">{s.icon}</span>
                  <div><div className="text-xl font-bold">{s.num}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
                </div>
              ))}
            </div>
            <p className="text-sm">The SpedCentral Learning Studio is our fully-featured live online tutoring platform.</p>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="relative overflow-hidden bg-brand-orange py-12">
        <div className="absolute -left-10 top-0 h-32 w-32 rotate-45 bg-brand-green" />
        <div className="absolute -right-10 top-0 h-32 w-32 rotate-45 bg-brand-yellow" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white">Looking to tutor with SpedCentral?</h2>
          <p className="mt-2 text-sm text-white/90">We're always looking for talented tutors. Set your own rate, get paid, and make a difference.</p>
          <button className="mt-5 rounded-md bg-white px-6 py-2.5 font-semibold text-brand-dark hover:bg-white/90">Apply now <ArrowRight className="ml-1 inline h-4 w-4" /></button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark py-14 text-white/80">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <FooterCol title="GET TO KNOW US" items={["About Us", "Contact Us", "FAQ", "Reviews", "Safety", "Security", "In the News"]} />
            <FooterCol title="LEARN WITH US" items={["Find a Tutor", "Request a Tutor", "Online Tutoring", "Learning Resources", "Blog", "Tell Us What You Think"]} />
            <FooterCol title="WORK WITH US" items={["Careers at SpedCentral", "Apply to Tutor", "Tutor Job Board", "Affiliates"]} />
            <div>
              <h4 className="text-sm font-bold text-white">DOWNLOAD OUR FREE APP</h4>
              <div className="mt-4 space-y-2">
                <a href="#" className="flex items-center gap-2 text-sm"><Apple className="h-4 w-4" /> App Store</a>
                <a href="#" className="flex items-center gap-2 text-sm"><Play className="h-4 w-4" /> Google Play</a>
              </div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 border-t border-white/10 pt-8 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold text-white">LET'S KEEP IN TOUCH</h4>
              <div className="mt-3 flex gap-3"><Facebook className="h-5 w-5" /><Instagram className="h-5 w-5" /><Linkedin className="h-5 w-5" /></div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">NEED MORE HELP?</h4>
              <p className="mt-3 text-sm">Learn more about how it works</p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-8 text-xs md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-bold text-white">TUTORS BY SUBJECT</h4>
              <div className="grid grid-cols-2 gap-y-2">
                {["Algebra Tutors","Calculus Tutors","Chemistry Tutors","Computer Tutors","Elementary Tutors","English Tutors","Geometry Tutors","Language Tutors","Math Tutors","Music Lessons","Physics Tutors","Reading Tutors","SAT Tutors","Science Tutors","Spanish Tutors","Statistics Tutors","Test Prep Tutors","Writing Tutors"].map((s) => <a key={s} href="#" className="hover:text-white">{s}</a>)}
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-bold text-white">TUTORS BY LOCATION</h4>
              <div className="grid grid-cols-2 gap-y-2">
                {["Atlanta Tutors","Boston Tutors","Brooklyn Tutors","Chicago Tutors","Dallas Tutors","Denver Tutors","Detroit Tutors","Houston Tutors","Los Angeles Tutors","Miami Tutors","New York City Tutors","Orange County Tutors","Philadelphia Tutors","Phoenix Tutors","San Francisco Tutors","Seattle Tutors","San Diego Tutors","Washington, DC Tutors"].map((s) => <a key={s} href="#" className="hover:text-white">{s}</a>)}
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
            © 2026 SpedCentral, Inc. — All Rights Reserved. &nbsp;·&nbsp; Sitemap · Cookies · Terms of Use · Privacy Policy
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => <li key={i}><a href="#" className="hover:text-white">{i}</a></li>)}
      </ul>
    </div>
  );
}
