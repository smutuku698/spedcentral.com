-- Seed data: reference lookups + the full category taxonomy for both
-- domains. Safe to re-run (all inserts are idempotent via ON CONFLICT).
-- This is the "ready for all 50 states / every SPED niche" category set --
-- Houston launches with a subset of providers/products, but the category
-- tree itself is already national/complete so URLs never need to change
-- as coverage expands.

-- ---------------------------------------------------------------------------
-- AGE GROUPS (shared by providers and products)
-- ---------------------------------------------------------------------------
insert into age_groups (name, slug, min_age, max_age, display_order) values
  ('Early Intervention (0-3)', 'early-intervention-0-3', 0, 3, 1),
  ('Preschool (3-5)', 'preschool-3-5', 3, 5, 2),
  ('Elementary (6-11)', 'elementary-6-11', 6, 11, 3),
  ('Adolescent (12-17)', 'adolescent-12-17', 12, 17, 4),
  ('Adult (18+)', 'adult-18-plus', 18, null, 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- LANGUAGES (starting set reflects Houston's diversity; expand as needed)
-- ---------------------------------------------------------------------------
insert into languages (name, code, slug) values
  ('English', 'en', 'english'),
  ('Spanish', 'es', 'spanish'),
  ('Vietnamese', 'vi', 'vietnamese'),
  ('Mandarin Chinese', 'zh', 'mandarin-chinese'),
  ('Arabic', 'ar', 'arabic'),
  ('French', 'fr', 'french'),
  ('Tagalog', 'tl', 'tagalog'),
  ('Urdu', 'ur', 'urdu'),
  ('Hindi', 'hi', 'hindi'),
  ('American Sign Language', 'ase', 'american-sign-language')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- INSURANCES / PAYERS
-- ---------------------------------------------------------------------------
insert into insurances (name, slug) values
  ('Aetna', 'aetna'),
  ('Blue Cross Blue Shield', 'blue-cross-blue-shield'),
  ('Cigna', 'cigna'),
  ('UnitedHealthcare', 'unitedhealthcare'),
  ('Humana', 'humana'),
  ('Medicaid', 'medicaid'),
  ('Medicare', 'medicare'),
  ('TRICARE', 'tricare'),
  ('Self-Pay / Private Pay', 'self-pay'),
  ('Sliding Scale Fee', 'sliding-scale')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- CREDENTIALS
-- ---------------------------------------------------------------------------
insert into credentials (name, abbreviation, slug) values
  ('Board Certified Behavior Analyst', 'BCBA', 'bcba'),
  ('Registered Behavior Technician', 'RBT', 'rbt'),
  ('Certified Clinical Speech-Language Pathologist', 'CCC-SLP', 'ccc-slp'),
  ('Occupational Therapist, Registered/Licensed', 'OTR/L', 'otr-l'),
  ('Licensed Physical Therapist', 'PT', 'pt'),
  ('Licensed Professional Counselor', 'LPC', 'lpc'),
  ('Licensed Clinical Social Worker', 'LCSW', 'lcsw'),
  ('Licensed Marriage and Family Therapist', 'LMFT', 'lmft'),
  ('Certified Special Education Teacher', 'SPED-Cert', 'sped-cert'),
  ('Orton-Gillingham Certified', 'OG', 'orton-gillingham'),
  ('Wilson Reading System Certified', 'Wilson', 'wilson-reading'),
  ('Board Certified Music Therapist', 'MT-BC', 'mt-bc'),
  ('Registered Art Therapist', 'ATR', 'atr'),
  ('Nationally Certified School Psychologist', 'NCSP', 'ncsp'),
  ('Assistive Technology Professional', 'ATP', 'atp'),
  ('Certified Educational Therapist', 'CET', 'cet')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- SERVICE CATEGORIES (providers/specialists directory)
-- Two-level taxonomy: a small set of top-level GROUPS (used for site
-- navigation/mega-menu and optional group hub pages) each containing the
-- specific specialist types (used for the actual listing/filter URLs,
-- e.g. /texas/houston/speech-language-pathologist/ -- short, matches how
-- people actually search, rather than nesting the group into the URL).
-- ---------------------------------------------------------------------------

-- top-level groups
insert into service_categories (name, slug, icon, display_order) values
  ('Medical & Clinical Therapists', 'medical-clinical-therapists', 'stethoscope', 10),
  ('Academic & School-Based Specialists', 'academic-school-based-specialists', 'graduation-cap', 20),
  ('Legal, Advocacy & Family Support', 'legal-advocacy-family-support', 'scale', 30),
  ('Early Intervention & Childcare', 'early-intervention-childcare', 'baby', 40),
  ('Adult & Transition Services', 'adult-transition-services', 'briefcase', 50),
  ('Recreation & Community', 'recreation-community', 'tent', 60),
  ('Facilities & Programs', 'facilities-programs', 'building', 70)
on conflict (slug) do nothing;

-- children: Medical & Clinical Therapists
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Speech-Language Pathologist (SLP)', 'speech-language-pathologist', 'mic', 1),
  ('Occupational Therapist (OT)', 'occupational-therapist', 'hand', 2),
  ('Physical Therapist (PT)', 'physical-therapist', 'activity', 3),
  ('Behavioral Therapist (ABA / BCBA / RBT)', 'behavioral-therapist-aba', 'puzzle', 4),
  ('Child Psychologist & Neuropsychologist', 'child-psychologist-neuropsychologist', 'brain', 5),
  ('Developmental Pediatrician', 'developmental-pediatrician', 'stethoscope', 6),
  ('Feeding Therapist', 'feeding-therapist', 'utensils', 7),
  ('Vision Therapist', 'vision-therapist', 'eye', 8),
  ('Music Therapist', 'music-therapist', 'music', 9),
  ('Art Therapist', 'art-therapist', 'palette', 10),
  ('Play Therapist', 'play-therapist', 'toy-brick', 11),
  ('Social Skills Coach', 'social-skills-coach', 'users', 12),
  ('Family & Child Counselor', 'family-child-counselor', 'heart-handshake', 13)
) as v(name, slug, icon, ord)
where service_categories.slug = 'medical-clinical-therapists'
on conflict (slug) do nothing;

-- children: Academic & School-Based Specialists
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Special Education Tutor', 'special-education-tutor', 'graduation-cap', 1),
  ('Dyslexia & Reading Specialist', 'dyslexia-reading-specialist', 'book-open', 2),
  ('Educational Therapist', 'educational-therapist', 'brain-cog', 3),
  ('Assistive Technology (AT) Specialist', 'assistive-technology-specialist', 'cpu', 4),
  ('Sensory Integration Specialist', 'sensory-integration-specialist', 'sparkles', 5),
  ('Educational Consultant', 'educational-consultant', 'compass', 6),
  ('Homeschool Consultant for SPED', 'homeschool-consultant-sped', 'home', 7),
  ('College Transition & Disability Services Consultant', 'college-transition-disability-services', 'school', 8)
) as v(name, slug, icon, ord)
where service_categories.slug = 'academic-school-based-specialists'
on conflict (slug) do nothing;

-- children: Legal, Advocacy & Family Support
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Special Education Advocate', 'special-education-advocate', 'shield-check', 1),
  ('Special Education Attorney', 'special-education-attorney', 'scale', 2),
  ('Neurodiversity Coach', 'neurodiversity-coach', 'compass', 3),
  ('Respite Care Provider', 'respite-care-provider', 'hand-heart', 4),
  ('Special Needs Legal & Financial Planner', 'special-needs-legal-financial-planner', 'landmark', 5)
) as v(name, slug, icon, ord)
where service_categories.slug = 'legal-advocacy-family-support'
on conflict (slug) do nothing;

-- children: Early Intervention & Childcare
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Early Intervention Specialist (Birth-3)', 'early-intervention-specialist', 'baby', 1),
  ('Special Needs Daycare & Preschool', 'special-needs-daycare-preschool', 'building-2', 2),
  ('Special Needs Caregiver / Nanny', 'special-needs-caregiver-nanny', 'user-heart', 3)
) as v(name, slug, icon, ord)
where service_categories.slug = 'early-intervention-childcare'
on conflict (slug) do nothing;

-- children: Adult & Transition Services
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Vocational Trainer / Job Coach', 'vocational-trainer-job-coach', 'briefcase', 1),
  ('Life Skills Coach', 'life-skills-coach', 'list-checks', 2),
  ('Supported & Independent Living Provider', 'supported-independent-living-provider', 'home', 3),
  ('Adult Day Program', 'adult-day-program', 'sun', 4)
) as v(name, slug, icon, ord)
where service_categories.slug = 'adult-transition-services'
on conflict (slug) do nothing;

-- children: Recreation & Community
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Adaptive Sports Program', 'adaptive-sports-program', 'medal', 1),
  ('Special Needs Camp', 'special-needs-camp', 'tent', 2),
  ('Sensory-Friendly Event Organizer', 'sensory-friendly-event-organizer', 'party-popper', 3),
  ('Parent Support Group', 'parent-support-group', 'users-round', 4)
) as v(name, slug, icon, ord)
where service_categories.slug = 'recreation-community'
on conflict (slug) do nothing;

-- children: Facilities & Programs
insert into service_categories (parent_category_id, name, slug, icon, display_order)
select id, v.name, v.slug, v.icon, v.ord from service_categories, (values
  ('Sensory Gym', 'sensory-gym', 'dumbbell', 1),
  ('Special Education Private School', 'special-education-private-school', 'school-2', 2),
  ('Multi-Disciplinary Therapy Clinic', 'multi-disciplinary-therapy-clinic', 'building', 3)
) as v(name, slug, icon, ord)
where service_categories.slug = 'facilities-programs'
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- ENVIRONMENTS (orthogonal to category -- "where is this used")
-- ---------------------------------------------------------------------------
insert into environments (name, slug, display_order) values
  ('Home', 'home', 1),
  ('School / Classroom', 'school-classroom', 2),
  ('Therapy / Clinic', 'therapy-clinic', 3),
  ('Community / Outdoors', 'community-outdoors', 4),
  ('Workplace', 'workplace', 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- PRODUCT CATEGORIES (tools/gadgets marketplace)
-- Four top-level groups matching how parents/teachers actually search --
-- by sensory need, communication need, classroom utility, or daily-living
-- skill -- not by product type. Tag every product with Category (what it
-- does) + Environment (Home/School/etc., above) + Age Group so a teacher
-- can filter to exactly "School" items and a parent to "Home" items from
-- the same catalog.
-- ---------------------------------------------------------------------------
insert into product_categories (name, slug, icon, display_order) values
  ('Sensory Integration & Regulation', 'sensory-integration-regulation', 'sparkles', 10),
  ('Assistive Technology & Communication', 'assistive-technology-communication', 'message-circle', 20),
  ('Adaptive Classroom & Learning Tools', 'adaptive-classroom-learning-tools', 'presentation', 30),
  ('Daily Living & Independent Skills', 'daily-living-independent-skills', 'home', 40)
on conflict (slug) do nothing;

-- children: Sensory Integration & Regulation
insert into product_categories (parent_category_id, name, slug, short_description, display_order)
select id, v.name, v.slug, v.descr, v.ord from product_categories, (values
  ('Calming & Deep Pressure', 'calming-deep-pressure', 'Weighted vests, weighted blankets, compression sheets, sensory swings', 1),
  ('Movement & Active Seating', 'movement-active-seating', 'Wobble stools, balance balls, fidget chair bands, therapy wedges, standing desks', 2),
  ('Fidgets & Oral Motor', 'fidgets-oral-motor', 'Chewelry, textured handheld fidgets, stress balls, noise-cancelling headphones', 3)
) as v(name, slug, descr, ord)
where product_categories.slug = 'sensory-integration-regulation'
on conflict (slug) do nothing;

-- children: Assistive Technology & Communication
insert into product_categories (parent_category_id, name, slug, short_description, display_order)
select id, v.name, v.slug, v.descr, v.ord from product_categories, (values
  ('AAC Devices & Tools', 'aac-devices-tools', 'AAC device covers, speech-generating button switches', 1),
  ('PECS & Communication Boards', 'pecs-communication-boards', 'Picture exchange systems, communication binders', 2),
  ('Sign Language Resources', 'sign-language-resources', null, 3),
  ('Reading & Writing Aids', 'reading-writing-aids', 'Text-to-speech pens, screen magnifiers, grip pencils, dysgraphia-friendly writing slopes, adapted audiobooks', 4),
  ('Vision & Hearing Assistive Devices', 'vision-hearing-assistive-devices', 'Low-vision aids, hearing aids, assistive listening devices', 5),
  ('Educational Software & Apps', 'educational-software-apps', null, 6)
) as v(name, slug, descr, ord)
where product_categories.slug = 'assistive-technology-communication'
on conflict (slug) do nothing;

-- children: Adaptive Classroom & Learning Tools
insert into product_categories (parent_category_id, name, slug, short_description, display_order)
select id, v.name, v.slug, v.descr, v.ord from product_categories, (values
  ('Visual Supports', 'visual-supports', 'Visual schedule boards, visual timers, token economy reward boards, emotion check-in charts', 1),
  ('Adapted School Supplies', 'adapted-school-supplies', 'Loop scissors, oversized grid paper, desktop privacy shields, high-contrast learning mats, adaptive math manipulatives', 2),
  ('Digital Downloads & Printables', 'digital-downloads-printables', 'Printable visual schedules, IEP goal trackers, lesson plans, PD courses -- creator marketplace (product_type=digital_download)', 3)
) as v(name, slug, descr, ord)
where product_categories.slug = 'adaptive-classroom-learning-tools'
on conflict (slug) do nothing;

-- children: Daily Living & Independent Skills
insert into product_categories (parent_category_id, name, slug, short_description, display_order)
select id, v.name, v.slug, v.descr, v.ord from product_categories, (values
  ('Adaptive Clothing & Footwear', 'adaptive-clothing-footwear', 'Tagless shirts, magnetic-closure shoes, weighted vests, adaptive compression socks', 1),
  ('Fine Motor & Feeding Tools', 'fine-motor-feeding-tools', 'Weighted utensils, adaptive suction plates, easy-grip cups', 2),
  ('Toileting & Bathing Aids', 'toileting-bathing-aids', null, 3),
  ('Sleep Aids', 'sleep-aids', null, 4),
  ('Safety & Wandering Prevention', 'safety-wandering-prevention', 'GPS trackers, safety harnesses, car seat modifications, door/window alarms', 5),
  ('Mobility & Positioning Equipment', 'mobility-positioning-equipment', 'Adaptive wheelchairs, walkers, therapy/exercise equipment, orthotic positioning equipment', 6),
  ('Adult Independent Living & Workplace Tools', 'adult-independent-living-workplace-tools', 'Independent living aids and workplace accommodation tools for adults', 7)
) as v(name, slug, descr, ord)
where product_categories.slug = 'daily-living-independent-skills'
on conflict (slug) do nothing;
