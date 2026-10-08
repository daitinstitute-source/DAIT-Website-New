/**
 * Online brochure copy — /brochure/ (English) and /brochure/mr/ (Marathi).
 *
 * The Marathi edition is written the way people in Sambhaji Nagar actually talk
 * about courses: simple Marathi with the everyday English words (Course, Batch,
 * Counselling, Projects, Fees, Job Roles…) left in English. Program titles, tool
 * names and job roles are NOT translated — they come from the programs
 * collection, so the brochure can never drift from the program pages.
 *
 * Only the per-program marketing lines live here, keyed by program slug.
 */

export type BrochureLang = "en" | "mr";

interface ProgramCopy {
  /** Short facts line under the title (duration comes from the collection). */
  meta: string;
  summary: string;
  build: string;
  /** Advanced-track line for working professionals. Omit for unlaunched programs. */
  proTrack?: string;
}

export interface BrochureCopy {
  seo: { title: string; description: string };
  switchLabel: string;
  hero: {
    eyebrow: string;
    /** `{kw}…{/kw}` marks the single orange keyword (BRAND.md heading rule). */
    heading: string;
    sub: string;
    coursesLabel: string;
    soon: string;
  };
  cta: { counselling: string; whatsapp: string; call: string; share: string; viewCourse: string; download: string };
  /** The details form shown before the PDF downloads. */
  gate: {
    pdf: string;
    title: string;
    intro: string;
    name: string;
    phone: string;
    email: string;
    emailHint: string;
    audience: string;
    audienceOptions: { value: "graduate" | "working-professional" | "other"; label: string }[];
    submit: string;
    sending: string;
    privacy: string;
    doneTitle: string;
    doneText: string;
    again: string;
    errRequired: string;
    errPhone: string;
    errEmail: string;
    errSend: string;
  };
  audience: {
    label: string;
    heading: string;
    intro: string;
    graduates: { title: string; points: string[] };
    professionals: { title: string; points: string[] };
  };
  courses: {
    label: string;
    heading: string;
    months: string;
    tools: string;
    build: string;
    roles: string;
    soonBadge: string;
    soonNote: string;
    programs: Record<string, ProgramCopy>;
  };
  why: {
    label: string;
    heading: string;
    founderRole: string;
    credentials: string[];
    bio: string;
    quote: string;
    points: { icon: string; title: string; text: string }[];
  };
  includes: { label: string; heading: string; items: string[]; fees: string };
  join: { label: string; heading: string; steps: { title: string; text: string }[] };
  contact: {
    label: string;
    heading: string;
    intro: string;
    enquiry: string;
    callOrWhatsapp: string;
    visit: string;
    hours: string;
    group: string;
  };
  share: { heading: string; text: string; message: string };
  whatsappMessage: string;
}

export const brochure: Record<BrochureLang, BrochureCopy> = {
  en: {
    seo: {
      title: "DAIT Institute Brochure — AI & IT Career Courses",
      description:
        "The DAIT Institute brochure: AI-led courses in software development, data analytics, digital marketing and cloud for graduates and working professionals in Sambhaji Nagar.",
    },
    switchLabel: "मराठी",
    hero: {
      eyebrow: "Brochure · For graduates & working professionals",
      heading: "Master {kw}in-demand skills{/kw} in AI, software, data & digital.",
      sub: "Mentor-led programs with real projects, current tools, and weekday or weekend batches.",
      coursesLabel: "Career courses in",
      soon: "Launching soon",
    },
    cta: {
      counselling: "Book Free Career Counselling",
      whatsapp: "Chat on WhatsApp",
      call: "Call",
      share: "Share on WhatsApp",
      viewCourse: "View full course",
      download: "Download Brochure (PDF)",
    },
    gate: {
      pdf: "/downloads/dait-institute-brochure.pdf",
      title: "Get the brochure as a {kw}PDF{/kw}",
      intro: "Share your details and the download starts straight away. An advisor may call to help you pick a track.",
      name: "Full name",
      phone: "Phone / WhatsApp",
      email: "Email",
      emailHint: "optional",
      audience: "I am a",
      audienceOptions: [
        { value: "graduate", label: "Fresh graduate / student" },
        { value: "working-professional", label: "Working professional" },
        { value: "other", label: "Parent / other" },
      ],
      submit: "Download the PDF",
      sending: "Sending…",
      privacy: "We use your details only to follow up on your enquiry.",
      doneTitle: "Your download has started",
      doneText: "If it did not start, use the button below. Questions? Chat with us on WhatsApp.",
      again: "Download again",
      errRequired: "Please share your name and phone number.",
      errPhone: "Please enter a valid 10-digit mobile number.",
      errEmail: "That email address doesn't look right. Correct it, or leave it blank.",
      errSend: "Something went wrong. Please try again, or message us on WhatsApp.",
    },
    audience: {
      label: "Who it's for",
      heading: "One institute, two {kw}career paths{/kw}.",
      intro:
        "Every DAIT program runs for fresh graduates and for people already in a job. Same curriculum, different timings and depth.",
      graduates: {
        title: "Fresh graduates",
        points: [
          "From degree to first job, on a structured track",
          "Weekday cohorts, Monday to Friday",
          "Portfolio of real projects to show employers",
          "Resume, LinkedIn and mock-interview prep",
        ],
      },
      professionals: {
        title: "Working professionals",
        points: [
          "Weekend cohorts — learn without leaving your job",
          "Switch careers, or move up in the one you have",
          "Advanced track: 3-month weekend intensive that skips the basics",
          "Skills you can apply at work from week one",
        ],
      },
    },
    courses: {
      label: "Programs",
      heading: "Choose your {kw}track{/kw}.",
      months: "",
      tools: "Tools",
      build: "You'll build",
      roles: "Roles",
      soonBadge: "Launching soon",
      soonNote: "Visit our office or call {phone} to register your enquiry.",
      programs: {
        "ai-led-software-development": {
          meta: "Beginner-friendly · No coding needed to start",
          summary:
            "Full-stack development with React, Node.js and AI-assisted coding. Ship deployed apps and graduate with a GitHub portfolio.",
          build: "A live React dashboard, REST APIs, and a full-stack capstone app deployed to the cloud.",
          proTrack: "Already coding? Advanced track: 3 months, weekends.",
        },
        "data-analytics-and-ai": {
          meta: "Beginner-friendly · No maths needed",
          summary:
            "SQL, Python, Power BI and AI. Turn raw data into decisions and graduate with a portfolio of real dashboards.",
          build: "Power BI and Tableau dashboards, plus an end-to-end capstone on a real dataset.",
          proTrack: "Working with data? Advanced track adds ML: 3 months, weekends.",
        },
        "ai-led-digital-marketing": {
          meta: "Beginner-friendly · Any stream",
          summary:
            "Performance marketing, SEO, analytics and AI-driven growth on the tools agencies use, with a portfolio of live campaigns.",
          build:
            "A live Google or Meta ad campaign, a blog post ranked on Google, and a full campaign for a real brand.",
          proTrack: "In marketing already? Advanced track: 3 months, weekends.",
        },
        "cloud-devops-and-security": {
          meta: "Beginner-friendly · No cloud background",
          summary:
            "Learn how modern software runs in production, and build and deploy real cloud infrastructure.",
          build: "A containerised app, deployed through your own CI/CD pipeline on cloud infrastructure.",
        },
      },
    },
    why: {
      label: "Why DAIT",
      heading: "How we train {kw}differently{/kw}.",
      founderRole: "Founder & CMO, DAIT Institute",
      credentials: ["IIM Raipur alumnus", "10+ years in industry"],
      bio: "A B2B marketing and pre-sales leader who built teams across the USA, Asia, the Middle East and DACH. He uses Claude, ChatGPT and Gemini every day — the same workflows he teaches at DAIT.",
      quote:
        "The true value of AI is not replacing people — it's helping skilled people do better work, faster and smarter.",
      points: [
        {
          icon: "lucide:award",
          title: "Founder-led mentorship",
          text: "Learn from a practitioner, not a rotating panel of part-time trainers.",
        },
        {
          icon: "lucide:rocket",
          title: "Live projects",
          text: "Build real apps, dashboards and campaigns — not slides.",
        },
        {
          icon: "lucide:sparkles",
          title: "AI-first from day one",
          text: "Every module uses the AI tools companies hire for today.",
        },
        {
          icon: "lucide:git-branch",
          title: "Two tracks, your pace",
          text: "Foundation for freshers, Advanced for working professionals.",
        },
        {
          icon: "lucide:life-buoy",
          title: "Career support that stays",
          text: "Portfolio reviews, resume, LinkedIn and interview prep.",
        },
      ],
    },
    includes: {
      label: "Every program includes",
      heading: "What comes with {kw}every course{/kw}.",
      items: [
        "Classroom, online or hybrid",
        "Weekday & weekend batches",
        "Small, mentor-led batches",
        "Capstone project",
        "Career & interview prep",
        "DAIT certificate",
      ],
      fees: "Founding-batch launch pricing. Ask your advisor for fees and the next start dates.",
    },
    join: {
      label: "How to join",
      heading: "Three steps to {kw}your first batch{/kw}.",
      steps: [
        {
          title: "Free career counselling",
          text: "Talk to an advisor about your background and goals.",
        },
        { title: "Pick your track", text: "Foundation or Advanced, weekday or weekend." },
        {
          title: "Join a cohort",
          text: "Small batches, mentor-led, with real projects from week one.",
        },
      ],
    },
    contact: {
      label: "Next step",
      heading: "Talk to a career advisor, {kw}free{/kw}.",
      intro:
        "Not sure which track fits? Book a counselling session. We'll look at your background honestly, including telling you if none of our programs is right for you.",
      enquiry: "Register your enquiry",
      callOrWhatsapp: "Call or WhatsApp",
      visit: "Visit our office",
      hours: "Mon–Sat · 9:00 AM – 6:00 PM",
      group: "DAIT is the newest institution from a family that has educated Sambhaji Nagar for over 25 years.",
    },
    share: {
      heading: "Know someone choosing a {kw}career{/kw}?",
      text: "Send this brochure to a friend, a classmate or your parents.",
      message: "DAIT Institute brochure — AI & IT career courses in Sambhaji Nagar:",
    },
    whatsappMessage:
      "Hi DAIT Institute, I saw your online brochure and would like to know more about your programs.",
  },

  mr: {
    seo: {
      title: "DAIT Institute Brochure (मराठी) — AI व IT Career Courses",
      description:
        "DAIT Institute चे brochure मराठीत: Software Development, Data Analytics, Digital Marketing आणि Cloud मधील AI-led courses — संभाजीनगरमधील graduates आणि working professionals साठी.",
    },
    switchLabel: "English",
    hero: {
      eyebrow: "Brochure · Graduates व Working Professionals साठी",
      heading: "AI, Software, Data व Digital मधील {kw}मागणीची skills{/kw} शिका.",
      sub: "Mentor-led courses, Live Projects आणि आजचे Tools — Weekday किंवा Weekend batches मध्ये.",
      coursesLabel: "Career Courses",
      soon: "लवकरच",
    },
    cta: {
      counselling: "Free Career Counselling Book करा",
      whatsapp: "WhatsApp वर Chat करा",
      call: "Call करा",
      share: "WhatsApp वर Share करा",
      viewCourse: "पूर्ण course पहा",
      download: "Brochure Download करा (PDF)",
    },
    gate: {
      pdf: "/downloads/dait-institute-brochure-marathi.pdf",
      title: "Brochure {kw}PDF{/kw} मध्ये मिळवा",
      intro: "तुमची माहिती द्या, download लगेच सुरू होईल. योग्य track निवडायला मदत करण्यासाठी आमचे counsellor तुम्हाला call करू शकतात.",
      name: "पूर्ण नाव",
      phone: "Phone / WhatsApp",
      email: "Email",
      emailHint: "ऐच्छिक",
      audience: "मी आहे",
      audienceOptions: [
        { value: "graduate", label: "Fresh Graduate / विद्यार्थी" },
        { value: "working-professional", label: "Working Professional" },
        { value: "other", label: "पालक / इतर" },
      ],
      submit: "PDF Download करा",
      sending: "पाठवत आहे…",
      privacy: "तुमची माहिती फक्त तुमच्या enquiry साठी वापरली जाईल.",
      doneTitle: "Download सुरू झाले आहे",
      doneText: "सुरू झाले नसेल तर खालील button वापरा. प्रश्न आहेत? WhatsApp वर Chat करा.",
      again: "पुन्हा Download करा",
      errRequired: "कृपया तुमचे नाव आणि phone number द्या.",
      errPhone: "कृपया योग्य 10 अंकी mobile number द्या.",
      errEmail: "Email बरोबर वाटत नाही. दुरुस्त करा किंवा रिकामा ठेवा.",
      errSend: "काहीतरी चुकले. पुन्हा प्रयत्न करा, किंवा WhatsApp वर message करा.",
    },
    audience: {
      label: "कोणासाठी?",
      heading: "एक Institute, दोन {kw}Career Paths{/kw}.",
      intro:
        "DAIT चा प्रत्येक course fresh graduates आणि job करणारे, दोघांसाठी आहे. Syllabus तोच — फक्त timing आणि level वेगळी.",
      graduates: {
        title: "Fresh Graduates",
        points: [
          "Degree नंतर पहिल्या job पर्यंत structured मार्ग",
          "सोमवार ते शुक्रवार Weekday batches",
          "Companies ना दाखवण्यासाठी real projects चा Portfolio",
          "Resume, LinkedIn आणि Mock Interview ची तयारी",
        ],
      },
      professionals: {
        title: "Working Professionals",
        points: [
          "Weekend batches — job न सोडता शिका",
          "Career बदला, किंवा सध्याच्या job मध्ये पुढे जा",
          "Advanced Track: basics सोडून 3 महिन्यांचा weekend course",
          "पहिल्या आठवड्यापासूनच job मध्ये वापरता येतील अशी skills",
        ],
      },
    },
    courses: {
      label: "Courses",
      heading: "तुमचा {kw}Track{/kw} निवडा.",
      months: "महिने",
      tools: "Tools",
      build: "तुम्ही काय बनवाल",
      roles: "Job Roles",
      soonBadge: "लवकरच",
      soonNote: "Registration साठी Office ला भेट द्या किंवा {phone} वर Call करा.",
      programs: {
        "ai-led-software-development": {
          meta: "Beginners साठी · Coding येणे आवश्यक नाही",
          summary:
            "React, Node.js आणि AI-assisted coding सह Full-Stack Development. Live apps बनवा आणि GitHub Portfolio सह course पूर्ण करा.",
          build: "Live React Dashboard, REST APIs आणि Cloud वर deploy केलेले Full-Stack Capstone App.",
          proTrack: "आधीच coding करता? Advanced Track: 3 महिने, weekends.",
        },
        "data-analytics-and-ai": {
          meta: "Beginners साठी · Maths background आवश्यक नाही",
          summary:
            "SQL, Python, Power BI आणि AI. Raw data मधून decisions घ्यायला शिका आणि real dashboards च्या Portfolio सह course पूर्ण करा.",
          build: "Power BI व Tableau Dashboards, आणि real data वर संपूर्ण Capstone Project.",
          proTrack: "Data सोबत काम करता? Advanced Track मध्ये ML: 3 महिने, weekends.",
        },
        "ai-led-digital-marketing": {
          meta: "Beginners साठी · Any Stream",
          summary:
            "Agencies वापरतात त्याच tools वर Performance Marketing, SEO, Analytics आणि AI — Live Campaigns च्या Portfolio सह.",
          build:
            "Live Google / Meta Ad Campaign, Google वर rank होणारी Blog Post, आणि real brand साठी संपूर्ण Campaign.",
          proTrack: "आधीच Marketing मध्ये आहात? Advanced Track: 3 महिने, weekends.",
        },
        "cloud-devops-and-security": {
          meta: "Beginners साठी · Cloud अनुभव नको",
          summary:
            "Modern software प्रत्यक्ष production मध्ये कसे चालते ते शिका, आणि real Cloud Infrastructure build व deploy करा.",
          build: "तुमच्या स्वतःच्या CI/CD Pipeline मधून Cloud वर deploy केलेले Containerised App.",
        },
      },
    },
    why: {
      label: "DAIT च का?",
      heading: "आमची Training पद्धत {kw}वेगळी{/kw}.",
      founderRole: "Founder & CMO, DAIT Institute",
      credentials: ["IIM Raipur Alumnus", "10+ वर्षांचा Industry अनुभव"],
      bio: "USA, Asia, Middle East आणि Europe (DACH) मध्ये teams उभारणारे B2B Marketing व Pre-Sales Leader. Claude, ChatGPT आणि Gemini ते रोज वापरतात — हेच practical workflows ते DAIT मध्ये शिकवतात.",
      quote:
        "AI माणसांची जागा घेण्यासाठी नाही — तर skilled माणसांना जास्त चांगले, जलद आणि smart काम करायला मदत करण्यासाठी आहे.",
      points: [
        {
          icon: "lucide:award",
          title: "Founder कडून थेट Mentorship",
          text: "Part-time trainers नाही — industry मध्ये प्रत्यक्ष काम करणाऱ्या expert कडून शिका.",
        },
        {
          icon: "lucide:rocket",
          title: "Live Projects",
          text: "फक्त slides नाही — real apps, dashboards आणि campaigns बनवा.",
        },
        {
          icon: "lucide:sparkles",
          title: "पहिल्या दिवसापासून AI",
          text: "आज companies ना हवे असलेले AI tools प्रत्येक module मध्ये.",
        },
        {
          icon: "lucide:git-branch",
          title: "दोन Tracks, तुमच्या सोयीने",
          text: "Freshers साठी Foundation, Working Professionals साठी Advanced.",
        },
        {
          icon: "lucide:life-buoy",
          title: "Course नंतरही Career Support",
          text: "Portfolio review, Resume, LinkedIn आणि Interview ची तयारी.",
        },
      ],
    },
    includes: {
      label: "प्रत्येक Course मध्ये",
      heading: "{kw}प्रत्येक course{/kw} सोबत काय मिळते.",
      items: [
        "Classroom, Online किंवा Hybrid",
        "Weekday व Weekend batches",
        "Small batches, mentor सोबत",
        "Capstone Project",
        "Career व Interview तयारी",
        "DAIT Certificate",
      ],
      fees: "पहिल्या batch साठी special launch fees. Fees आणि पुढील batch च्या तारखांसाठी आमच्या counsellor ला विचारा.",
    },
    join: {
      label: "Admission कसे घ्यावे?",
      heading: "{kw}पहिल्या batch{/kw} पर्यंत तीन steps.",
      steps: [
        {
          title: "Free Career Counselling",
          text: "तुमचे शिक्षण आणि goals बद्दल counsellor शी बोला.",
        },
        { title: "तुमचा Track निवडा", text: "Foundation किंवा Advanced, Weekday किंवा Weekend." },
        {
          title: "Batch join करा",
          text: "Small batches, mentor सोबत, पहिल्या आठवड्यापासून real projects.",
        },
      ],
    },
    contact: {
      label: "पुढचे पाऊल",
      heading: "Career Counsellor शी बोला — {kw}मोफत{/kw}.",
      intro:
        "कोणता course योग्य आहे, confusion आहे? Counselling session book करा. आम्ही तुमचा background प्रामाणिकपणे पाहू — आमचा कोणताही course तुमच्यासाठी योग्य नसेल, तर तेही स्पष्ट सांगू.",
      enquiry: "Registration व Enquiry साठी",
      callOrWhatsapp: "Call किंवा WhatsApp",
      visit: "Office ला भेट द्या",
      hours: "सोम–शनि · सकाळी 9 ते संध्याकाळी 6",
      group: "25 वर्षांहून जास्त काळ संभाजीनगरमध्ये शिक्षण देणाऱ्या Dhakne कुटुंबाची DAIT ही नवीन Institute.",
    },
    share: {
      heading: "{kw}Career{/kw} निवडणारे कोणी ओळखीचे आहे?",
      text: "हे brochure मित्राला, classmate ला किंवा पालकांना पाठवा.",
      message: "DAIT Institute brochure — संभाजीनगरमधील AI व IT Career Courses:",
    },
    whatsappMessage:
      "नमस्कार DAIT Institute, मी तुमचे online brochure पाहिले. मला तुमच्या courses बद्दल माहिती हवी आहे.",
  },
};

/** Program order on the brochure. The last one is unlaunched (draft) and shown as "launching soon". */
export const brochureProgramSlugs = [
  "ai-led-software-development",
  "data-analytics-and-ai",
  "ai-led-digital-marketing",
  "cloud-devops-and-security",
] as const;
