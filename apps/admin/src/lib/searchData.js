/**
 * Searchable public content index for WINGS Counselling Centre.
 * Contains only public pages, services, articles, topics, and events.
 * No admin or internal routes are included.
 */

export const STATIC_SEARCH_ITEMS = [
  // --- Core Public Pages ---
  {
    id: "page-home",
    title: "Home",
    category: "Page",
    route: "/",
    description: "WINGS Counselling Centre provides compassionate, professional counselling, individual & family therapy, youth support, and clinical supervision in Singapore.",
    keywords: ["home", "counselling", "therapy", "singapore", "wings", "support", "mental health", "supervision"],
  },
  {
    id: "page-about",
    title: "About Us",
    category: "About",
    route: "/about-us",
    description: "Learn about WINGS Counselling Centre, our mission, vision, clinical history, and commitment to providing accessible mental health care and therapy in Singapore.",
    keywords: ["about", "history", "mission", "vision", "clinical", "centre", "who we are", "team", "organization"],
  },
  {
    id: "page-team",
    title: "Our Clinical Team",
    category: "Team",
    route: "/team",
    description: "Meet our dedicated team of experienced counsellors, therapists, clinical supervisors, and mental health professionals at WINGS Counselling Centre.",
    keywords: ["team", "counsellors", "therapists", "staff", "supervisors", "clinical", "meet", "practitioners", "appointment"],
  },
  {
    id: "page-careers",
    title: "Careers & Opportunities",
    category: "Careers",
    route: "/career",
    description: "Explore career opportunities at WINGS Counselling Centre and learn about roles, workplace values, and how your skills can support people seeking care.",
    keywords: ["career", "careers", "jobs", "openings", "vacancies", "hiring", "counsellor jobs", "work with us", "opportunities"],
  },
  {
    id: "page-articles",
    title: "Mental Health Articles & Insights",
    category: "Articles",
    route: "/articles",
    description: "Recent articles from WINGS Counselling Centre share expert advice on life's challenges, emotional health, coping strategies, and finding the right support.",
    keywords: ["articles", "insights", "resources", "mental health", "blog", "reading", "tips", "advice", "coping"],
  },
  {
    id: "page-volunteer",
    title: "Volunteer with Us",
    category: "Get Involved",
    route: "/volunteer",
    description: "Join WINGS Counselling Centre as a volunteer and help empower individuals, families, and communities through mental health awareness and community support.",
    keywords: ["volunteer", "volunteering", "community", "involvement", "support", "help", "donate time"],
  },
  {
    id: "page-events",
    title: "Events & Workshops",
    category: "Events",
    route: "/events",
    description: "Discover upcoming mental health events, community workshops, parenting talks, and clinical training sessions hosted by WINGS Counselling Centre.",
    keywords: ["events", "workshops", "talks", "seminars", "training", "programmes", "sessions", "community"],
  },
  {
    id: "page-partners",
    title: "Our Partners & Collaborators",
    category: "About",
    route: "/partners",
    description: "Mental wellness in Singapore grows through local partnerships. We work with health experts, schools, and community groups to build support that helps people thrive.",
    keywords: ["partners", "collaborators", "schools", "organizations", "network", "community", "alliances"],
  },
  {
    id: "page-contact",
    title: "Contact Us",
    category: "Contact",
    route: "/#contact",
    description: "Get in touch with WINGS Counselling Centre. Find our location, phone number, operating hours, and book an appointment or send an enquiry.",
    keywords: ["contact", "reach us", "location", "address", "phone", "email", "appointment", "enquiry", "touch", "get in touch"],
  },

  // --- Services & Sub-Services ---
  {
    id: "service-main",
    title: "Counselling & Therapy Services",
    category: "Service",
    route: "/services",
    description: "Explore our comprehensive counselling services including individual therapy, couples & marital therapy, family support, youth counselling, and clinical supervision.",
    keywords: ["services", "counselling", "therapy", "individual", "couples", "marital", "family", "supervision", "training"],
  },
  {
    id: "service-individual",
    title: "Individual Counselling & Therapy",
    category: "Service",
    route: "/services/sub/24",
    description: "Individual counselling in Singapore at WINGS Counselling Centre offers a safe space to work through stress, relationships, anxiety, and life changes.",
    keywords: ["individual", "personal therapy", "one on one", "stress", "anxiety", "life changes", "counselling", "adults", "depression"],
  },
  {
    id: "service-family",
    title: "Family Support & Counselling Program (FSCP)",
    category: "Service",
    route: "/services/sub/26",
    description: "Explore family counselling and programs at WINGS Counselling Centre. Find support to improve communication, work through conflict, and strengthen family ties.",
    keywords: ["family", "family counselling", "fscp", "conflict", "communication", "parents", "children", "ties", "harmony"],
  },
  {
    id: "service-marital",
    title: "Couples & Marital Relationship Counselling",
    category: "Service",
    route: "/services/sub/25",
    description: "Couples relationship counselling and therapy at WINGS Counselling Centre helps couples talk through conflict, rebuild trust, and find a practical way forward together.",
    keywords: ["relationship", "marital", "marriage", "couples", "couples therapy", "divorce", "infidelity", "trust", "conflict", "communication"],
  },
  {
    id: "service-preschool",
    title: "Pre-School Children Counselling Programme",
    category: "Service",
    route: "/services/sub/23",
    description: "WINGS Counselling Centre offers pre-school children counselling for worries, family changes, and social struggles with caring, play-based support.",
    keywords: ["children", "pre-school", "preschool", "toddler", "kids", "play therapy", "child counselling", "behavior"],
  },
  {
    id: "service-youth",
    title: "Counselling for Youth in Singapore",
    category: "Service",
    route: "/services/sub/22",
    description: "Counselling for youth in Singapore at WINGS Counselling Centre offers a safe place to talk through stress, school worries, emotional struggles, and family concerns.",
    keywords: ["youth", "teen", "teens", "adolescent", "young people", "school stress", "exam stress", "identity", "peer pressure"],
  },
  {
    id: "service-workplace",
    title: "Workplace Relationships & Corporate Workshops",
    category: "Service",
    route: "/services/sub/20",
    description: "Building relationships in the workplace takes trust, clear talk, and respect. WINGS Counselling Centre offers practical workshops and team wellness tips.",
    keywords: ["workplace", "work", "corporate", "team", "organization", "burnout", "work stress", "relationships", "workshop"],
  },
  {
    id: "service-personal-therapy",
    title: "Psychological Assistance & Personal Therapy Help",
    category: "Service",
    route: "/services/sub/16",
    description: "Personal therapy at WINGS Counselling Centre offers a safe place to talk through stress, grief, trauma, or change, including specialized support for counsellors.",
    keywords: ["personal therapy", "psychological", "assistance", "counsellors", "practitioners", "grief", "trauma", "well-being"],
  },
  {
    id: "service-supervision",
    title: "Counselling & Clinical Supervision",
    category: "Service",
    route: "/services/sub/27",
    description: "Counselling and clinical supervision at WINGS Counselling Centre support personal growth, case consultations, and stronger professional practice.",
    keywords: ["supervision", "clinical supervision", "counsellor training", "case consultation", "professional growth", "counselling"],
  },

  // --- Support Topics / Issues ---
  {
    id: "topic-relationship",
    title: "Relationship Issues & Couples Support",
    category: "Topic",
    route: "/support/relationship-issues",
    description: "Explore ways to improve communication, strengthen relationships, and access professional support to navigate difficult situations together.",
    keywords: ["relationship", "relationships", "couples", "marriage", "marital", "communication", "trust", "breakup", "conflict"],
  },
  {
    id: "topic-depression",
    title: "Understanding Depression & Low Mood",
    category: "Topic",
    route: "/support/Depression",
    description: "Depression is a common mental health condition. Learn about its symptoms, causes, and discover professional support to help manage your mental well-being.",
    keywords: ["depression", "depressed", "low mood", "sadness", "hopelessness", "mental health", "wellness", "coping"],
  },
  {
    id: "topic-anxiety",
    title: "Stress & Anxiety Support",
    category: "Topic",
    route: "/support/stress-anxiety",
    description: "Learn more about stress and anxiety, explore practical coping strategies, grounding techniques, and discover professional support tailored to your needs.",
    keywords: ["anxiety", "anxious", "stress", "panic", "worry", "panic attacks", "overwhelmed", "grounding"],
  },
  {
    id: "topic-family-conflict",
    title: "Family Conflicts Support",
    category: "Topic",
    route: "/support/family-conflicts",
    description: "Learn how family relationships can be strengthened, understand common sources of conflict, and explore professional support to improve family connection.",
    keywords: ["family", "conflicts", "disputes", "parents", "siblings", "harmony", "communication"],
  },
  {
    id: "topic-parenting",
    title: "Parenting Challenges & Guidance",
    category: "Topic",
    route: "/support/parenting-challenges",
    description: "Discover practical parenting strategies, understand your child's developmental needs, and explore professional guidance for every stage of parenthood.",
    keywords: ["parenting", "parents", "children", "child", "raising kids", "behavioral concerns", "guidance"],
  },
  {
    id: "topic-burnout",
    title: "Burnout & Work Stress Management",
    category: "Topic",
    route: "/support/burnout-work-stress",
    description: "Recognise the signs of burnout, understand the effects of prolonged work stress, and discover strategies to restore balance and well-being.",
    keywords: ["burnout", "work stress", "exhaustion", "job fatigue", "workplace", "work life balance"],
  },
  {
    id: "topic-trauma",
    title: "Trauma & PTSD Recovery",
    category: "Topic",
    route: "/support/trauma-ptsd",
    description: "Learn about trauma and post-traumatic stress, recognise common symptoms, and discover compassionate support for your recovery journey.",
    keywords: ["trauma", "ptsd", "traumatic", "flashbacks", "recovery", "emotional distress"],
  },
  {
    id: "topic-grief",
    title: "Grief & Loss Counselling",
    category: "Topic",
    route: "/support/grief-loss",
    description: "Understand the emotional impact of loss, learn healthy ways to cope with grief, and discover compassionate support during difficult times.",
    keywords: ["grief", "loss", "bereavement", "mourning", "death of loved one", "sadness"],
  },

  // --- Specific Articles ---
  {
    id: "article-relationship",
    title: "Relationship Counselling Services: Communication & Trust",
    category: "Article",
    route: "/article/relationship-issues",
    description: "Looking for relationship counselling services in Singapore? WINGS Counselling offers professional support to improve communication, resolve conflicts, and strengthen relationships.",
    keywords: ["relationship counselling", "article", "couples", "marriage", "communication", "trust", "infidelity"],
  },
  {
    id: "article-depression",
    title: "Counselling for Depression & Anxiety",
    category: "Article",
    route: "/article/understanding-depression",
    description: "Counselling for depression and anxiety at WINGS Counselling Centre offers a safe space to explore what's hard and find practical steps toward feeling better.",
    keywords: ["counselling for depression and anxiety", "depression", "anxiety", "article", "mental health", "therapy"],
  },
  {
    id: "article-mental-health",
    title: "Mental Health Counselling in Singapore",
    category: "Article",
    route: "/article/mental-health",
    description: "Find compassionate mental health counselling in Singapore at WINGS Counselling Centre. Get professional support for stress, anxiety, depression, relationships, and more.",
    keywords: ["mental health", "counselling in singapore", "stigma", "help seeking", "stress", "depression", "article"],
  },
  {
    id: "article-parenting",
    title: "Parenting Challenges & Child Development Guide",
    category: "Article",
    route: "/article/parenting-challenges",
    description: "Explore parenting counselling in Singapore with WINGS Counselling Centre. Get professional support to overcome parenting challenges and build stronger family relationships.",
    keywords: ["parenting counselling", "parenting challenges", "article", "children", "family", "behavior"],
  },
  {
    id: "article-grounding",
    title: "Grounding Techniques for Anxiety (5-4-3-2-1 Method)",
    category: "Article",
    route: "/GroundingTechniques",
    description: "Learn practical grounding techniques to manage anxiety, panic, and distress from WINGS Counselling Centre, including controlled breathing and micro-movements.",
    keywords: ["grounding techniques", "anxiety", "panic", "5 4 3 2 1", "breathing", "coping", "article"],
  },
];

/**
 * Perform a keyword-based search against the index.
 * - Trims whitespace
 * - Case-insensitive
 * - Supports partial multi-word matches
 * - Returns ranked results by relevance
 */
export function searchWebsite(query, dynamicItems = []) {
  if (!query || typeof query !== "string") return [];
  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery.length === 0) return [];

  const searchTerms = cleanQuery.split(/\s+/).filter(Boolean);
  const allItems = [...STATIC_SEARCH_ITEMS, ...dynamicItems];

  // Remove duplicates by route
  const seenRoutes = new Set();
  const uniqueItems = [];
  for (const item of allItems) {
    if (!seenRoutes.has(item.route)) {
      seenRoutes.add(item.route);
      uniqueItems.push(item);
    }
  }

  const results = [];

  for (const item of uniqueItems) {
    const title = (item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const keywords = Array.isArray(item.keywords) ? item.keywords.join(" ").toLowerCase() : "";

    let score = 0;

    // Exact full query match
    if (title === cleanQuery) score += 100;
    else if (title.startsWith(cleanQuery)) score += 60;
    else if (title.includes(cleanQuery)) score += 40;

    if (keywords.includes(cleanQuery)) score += 30;
    if (cat.includes(cleanQuery)) score += 20;
    if (desc.includes(cleanQuery)) score += 15;

    // Check individual search terms
    let allTermsMatch = true;
    for (const term of searchTerms) {
      const termInTitle = title.includes(term);
      const termInKeywords = keywords.includes(term);
      const termInDesc = desc.includes(term);
      const termInCat = cat.includes(term);

      if (termInTitle || termInKeywords || termInDesc || termInCat) {
        if (termInTitle) score += 20;
        if (termInKeywords) score += 10;
        if (termInCat) score += 8;
        if (termInDesc) score += 5;
      } else {
        allTermsMatch = false;
      }
    }

    if (score > 0 && allTermsMatch) {
      results.push({ ...item, score });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 10);
}
