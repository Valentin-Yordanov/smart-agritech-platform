export type PathogenCategory = 'Fungal' | 'Oomycete' | 'Bacterial / Pest' | 'Viral';

export interface ChemicalProtocol {
  activeIngredient: string;
  fracIracGroup: string;
  phiDays: string;
  notes: string;
}

export interface AgronomyGuide {
  slug: string;
  title: string;
  hostCrop: string;
  scientificName: string;
  pathogenType: PathogenCategory;
  severityRisk: 'Critical' | 'High' | 'Moderate';
  summary: string;
  optimalConditions: string;
  symptomsChecklist: string[];
  biologicalControls: string[];
  chemicalProtocols: ChemicalProtocol[];
  culturalPractices: string[];
}

export const KNOWLEDGE_GUIDES: AgronomyGuide[] = [
  {
    slug: 'tomato-early-blight',
    title: 'Tomato — Early Blight',
    hostCrop: 'Tomato',
    scientificName: 'Alternaria solani',
    pathogenType: 'Fungal',
    severityRisk: 'High',
    summary:
      'A pervasive foliar and stem fungal disease causing progressive defoliation, stem collar rot, and sunken fruit lesions near the calyx under warm, humid canopies.',
    optimalConditions:
      '24°C–29°C temperatures with >85% relative humidity or alternating wet/dry leaf cycles.',
    symptomsChecklist: [
      'Dark brown to black necrotic spots on older lower leaves first',
      'Concentric "bullseye" or target-board rings inside expanding lesions (6–12 mm)',
      'Distinct chlorotic (yellow) halos surrounding foliar spots',
      'Sunken, leathery dark lesions at the stem end of maturing fruit',
    ],
    biologicalControls: [
      'Bacillus subtilis (strain QST 713) or Bacillus amyloliquefaciens foliar biofungicides every 7 days',
      'Copper hydroxide or copper octanoate preventatively prior to canopy closure',
      'Potassium bicarbonate sprays to disrupt fungal spore germination on leaf surfaces',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Chlorothalonil / Mancozeb',
        fracIracGroup: 'FRAC M05 / M03 (Contact)',
        phiDays: '0–5 days',
        notes: 'Preventive surface barrier before infection peaks.',
      },
      {
        activeIngredient: 'Azoxystrobin / Pyraclostrobin',
        fracIracGroup: 'FRAC 11 (QoI Systemic)',
        phiDays: '0–1 days',
        notes: 'Limit to 2 consecutive sprays; rotate with FRAC 3 or 7.',
      },
      {
        activeIngredient: 'Difenoconazole + Boscalid',
        fracIracGroup: 'FRAC 3 + FRAC 7',
        phiDays: '0–7 days',
        notes: 'Strong curative and translaminar activity under high pressure.',
      },
    ],
    culturalPractices: [
      'Enforce a 3- to 4-year rotation away from Solanaceae crops (potato, pepper, eggplant)',
      'Switch from overhead sprinklers to drip irrigation to keep foliage dry',
      'Prune lower leaves up to 30 cm above soil line and apply straw/plastic mulch',
    ],
  },
  {
    slug: 'potato-late-blight',
    title: 'Potato — Late Blight',
    hostCrop: 'Potato',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Oomycete',
    severityRisk: 'Critical',
    summary:
      'An aggressive oomycete water mold capable of defoliating entire potato and tomato fields within 7–14 days via windborne sporangia.',
    optimalConditions:
      'Cool, wet microclimates (10°C–21°C) with >90% humidity and 8+ hours of free leaf moisture.',
    symptomsChecklist: [
      'Irregular, water-soaked pale green to purplish-black lesions on leaf tips and margins',
      'Delicate white cottony sporangiophores visible on leaf undersides under high humidity',
      'Dark greasy stem and petiole cankers leading to brittle stem collapse',
      'Copper-brown granular dry rot extending 5–15 mm beneath tuber skin',
    ],
    biologicalControls: [
      'Proactive fixed-copper formulations (copper octanoate / copper hydroxide) triggered by humidity alerts',
      'Trichoderma harzianum and Bacillus subtilis root/crown bioprotectants to reduce secondary rot',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Mandipropamid',
        fracIracGroup: 'FRAC 40 (CAA)',
        phiDays: '14 days',
        notes: 'High rainfastness and oomycete-specific translaminar protection.',
      },
      {
        activeIngredient: 'Cymoxanil + Fluazinam',
        fracIracGroup: 'FRAC 27 + FRAC 29',
        phiDays: '7–14 days',
        notes: 'Curative kick-back activity within 24–48 hours of infection.',
      },
      {
        activeIngredient: 'Propamocarb Hydrochloride',
        fracIracGroup: 'FRAC 28',
        phiDays: '14 days',
        notes: 'Rotate across FRAC groups every spray cycle to avoid resistance.',
      },
    ],
    culturalPractices: [
      'Plant strictly certified disease-free seed tubers and destroy all cull piles',
      'Hill soil deeply around tubers to block rain-washed sporangia from reaching tubers',
      'Desiccate or flail vines 2–3 weeks before harvest to prevent tuber inoculation',
    ],
  },
  {
    slug: 'grape-mildew',
    title: 'Grapevine — Downy & Powdery Mildew',
    hostCrop: 'Grapevine',
    scientificName: 'Plasmopara viticola / Erysiphe necator',
    pathogenType: 'Fungal',
    severityRisk: 'Critical',
    summary:
      'Dual mildew threat in Balkan vineyards: Downy mildew (oomycete) attacks wet foliage and clusters, while Powdery mildew thrives in warm, shaded canopies.',
    optimalConditions:
      'Downy: 18°C–25°C + rainfall >10 mm. Powdery: 20°C–28°C + high ambient humidity without free water.',
    symptomsChecklist: [
      'Translucent yellow "oil spots" on upper leaf surfaces with white downy tufts underneath (Downy)',
      'Grayish-white talcum powder patches on upper leaves, shoots, and berries (Powdery)',
      'Berry shriveling, skin cracking, and sour-rot secondary colonization',
    ],
    biologicalControls: [
      'Micronized wettable sulfur for powdery mildew (avoid applying above 32°C or within 14 days of oils)',
      'Copper hydroxide / Bordeaux mixture for downy mildew during pre-bloom and post-veraison windows',
      'Ampelomyces quisqualis hyperparasitic biofungicide targeting powdery mildew hyphae',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Myclobutanil / Tebuconazole',
        fracIracGroup: 'FRAC 3 (DMI)',
        phiDays: '14–21 days',
        notes: 'Systemic powdery mildew control; alternate with FRAC 11 or 50.',
      },
      {
        activeIngredient: 'Metalaxyl-M + Copper',
        fracIracGroup: 'FRAC 4 + M01',
        phiDays: '28 days',
        notes: 'Targeted systemic + contact protection against downy mildew.',
      },
      {
        activeIngredient: 'Metrafenone',
        fracIracGroup: 'FRAC 50',
        phiDays: '28 days',
        notes: 'Specialized powdery mildew protectant for resistance rotation.',
      },
    ],
    culturalPractices: [
      'Perform timely shoot positioning and basal leaf removal around fruiting zones for airflow',
      'Avoid excessive nitrogen fertilization that promotes dense, susceptible succulent shoots',
      'Sanitize vineyard floor and prune out infected overwintering canes',
    ],
  },
  {
    slug: 'pepper-bacterial-spot',
    title: 'Bell Pepper — Bacterial Spot & Spider Mites',
    hostCrop: 'Bell Pepper',
    scientificName: 'Xanthomonas spp. / Tetranychus urticae',
    pathogenType: 'Bacterial / Pest',
    severityRisk: 'High',
    summary:
      'Warm-season greenhouse and open-field pepper complex combining bacterial foliar lesions with hot-weather two-spotted spider mite outbreaks.',
    optimalConditions:
      'Bacterial spot: 25°C–30°C + wind-driven rain. Spider mites: >28°C, low humidity, and dusty drought stress.',
    symptomsChecklist: [
      'Small water-soaked circular spots turning dark brown/black with raised scab margins on fruit',
      'Fine yellow or bronze stippling on upper leaf surfaces from mite piercing',
      'Silken webbing on leaf undersides and shoot tips under heavy mite pressure',
    ],
    biologicalControls: [
      'Release predatory mites Phytoseiulus persimilis (high humidity) or Neoseiulus californicus (heat tolerant)',
      'Potassium salts of fatty acids (insecticidal soap) or 1% horticultural mineral oil with thorough under-leaf coverage',
      'Copper octanoate + Bacillus subtilis tank-mix to suppress Xanthomonas spread',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Copper Hydroxide + Mancozeb',
        fracIracGroup: 'FRAC M01 + M03',
        phiDays: '5 days',
        notes: 'Standard bactericide mix to overcome copper-tolerant Xanthomonas strains.',
      },
      {
        activeIngredient: 'Abamectin',
        fracIracGroup: 'IRAC 6 (Avermectin)',
        phiDays: '7 days',
        notes: 'Translaminar miticide; target mobile mite stages.',
      },
      {
        activeIngredient: 'Bifenazate / Spiromesifen',
        fracIracGroup: 'IRAC 20D / 23',
        phiDays: '3–7 days',
        notes: 'Rotate miticide IRAC groups to prevent rapid acaricide resistance.',
      },
    ],
    culturalPractices: [
      'Use certified pathogen-free seed and hot-water seed treatment',
      'Avoid working in pepper rows while foliage is wet to prevent mechanical bacterial spread',
      'Suppress perimeter road dust and maintain consistent drip irrigation to reduce mite fecundity',
    ],
  },
  {
    slug: 'apple-scab',
    title: 'Apple — Apple Scab',
    hostCrop: 'Apple',
    scientificName: 'Venturia inaequalis',
    pathogenType: 'Fungal',
    severityRisk: 'High',
    summary:
      'The most economically damaging spring fungal disease of apple orchards, causing olive-green velvety foliar spots and corky, deformed fruit scabs.',
    optimalConditions:
      'Spring rain events between 15°C–22°C during budbreak through petal fall (Mills infection periods).',
    symptomsChecklist: [
      'Olive-green to dark brown velvety circular lesions on upper and lower leaf surfaces',
      'Premature yellowing and early summer leaf drop weakening tree vigor',
      'Dark, corky, sunken scabs and radial cracking on developing apples',
    ],
    biologicalControls: [
      'Autumn foliar urea (5%) or shredded leaf litter composting to accelerate breakdown of overwintering pseudothecia',
      'Liquid lime sulfur or wettable sulfur sprays during primary ascospore discharge windows',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Captan',
        fracIracGroup: 'FRAC M04 (Multi-site)',
        phiDays: '0–14 days',
        notes: 'Core protective fungicide; low resistance risk.',
      },
      {
        activeIngredient: 'Myclobutanil / Difenoconazole',
        fracIracGroup: 'FRAC 3 (DMI)',
        phiDays: '14 days',
        notes: 'Post-infection curative reach within 72–96 hours of Mills infection.',
      },
      {
        activeIngredient: 'Cyprodinil',
        fracIracGroup: 'FRAC 9 (AP)',
        phiDays: '14 days',
        notes: 'Effective in cool early-spring temperatures when DMIs underperform.',
      },
    ],
    culturalPractices: [
      'Plant scab-resistant cultivars carrying Vf gene (e.g., Topaz, Enterprise, Liberty)',
      'Prune orchard canopies annually to open central leaders for rapid drying',
      'Flail-mow fallen leaves in late autumn to eliminate primary spring inoculum',
    ],
  },
  {
    slug: 'corn-leaf-blight',
    title: 'Corn (Maize) — Northern Corn Leaf Blight',
    hostCrop: 'Corn (Maize)',
    scientificName: 'Exserohilum turcicum',
    pathogenType: 'Fungal',
    severityRisk: 'Moderate',
    summary:
      'A foliar fungal disease producing distinctive cigar-shaped necrotic lesions that reduce photosynthetic area during grain fill and predispose stalks to lodging.',
    optimalConditions:
      'Moderate temperatures (18°C–27°C) with heavy morning dew, fog, or prolonged overcast humidity.',
    symptomsChecklist: [
      'Long, elliptical, grayish-green to tan "cigar-shaped" lesions (2.5–15 cm long)',
      'Lesions parallel to leaf veins, starting on lower canopy leaves and moving upward',
      'Dark olive-gray spore dusting visible inside mature lesions after damp nights',
    ],
    biologicalControls: [
      'Trichoderma-enriched residue inoculants to accelerate breakdown of infected corn stover',
      'Bacillus-based foliar biostimulants to bolster systemic acquired resistance (SAR)',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Azoxystrobin + Propiconazole',
        fracIracGroup: 'FRAC 11 + FRAC 3',
        phiDays: '30 days',
        notes: 'Apply at VT/R1 tasseling-silking stage if lesions reach ear leaf.',
      },
      {
        activeIngredient: 'Pyraclostrobin + Fluxapyroxad',
        fracIracGroup: 'FRAC 11 + FRAC 7',
        phiDays: '21 days',
        notes: 'Protects upper canopy foliage during critical grain-fill window.',
      },
    ],
    culturalPractices: [
      'Select hybrids rated high for Ht-gene polygenic NCLB resistance',
      'Rotate corn with soybean, sunflower, or winter wheat for at least 1–2 seasons',
      'Incorporate or shred heavily infected surface crop residue after harvest',
    ],
  },
  {
    slug: 'rice-blast',
    title: 'Rice — Blast',
    hostCrop: 'Rice',
    scientificName: 'Magnaporthe oryzae',
    pathogenType: 'Fungal',
    severityRisk: 'High',
    summary:
      'The most damaging fungal disease of rice. It attacks leaves, nodes and the panicle neck; neck blast leaves white, empty panicles.',
    optimalConditions:
      '24°C–28°C with 10+ hours of leaf wetness, high humidity, excess nitrogen or drought stress.',
    symptomsChecklist: [
      'Spindle- or diamond-shaped leaf lesions with grey centres and brown margins',
      'Blackened nodes that break easily',
      'Grey-brown rot at the panicle neck with white, unfilled panicles',
    ],
    biologicalControls: [
      'Seed treatment with Trichoderma or Pseudomonas fluorescens formulations',
      'Silicon fertilisation to strengthen leaf tissue',
    ],
    chemicalProtocols: [
      {
        activeIngredient: 'Tricyclazole',
        fracIracGroup: 'FRAC 16.1 (MBI-R)',
        phiDays: 'See label',
        notes: 'Preventive at late tillering and booting/heading.',
      },
      {
        activeIngredient: 'Azoxystrobin + Difenoconazole',
        fracIracGroup: 'FRAC 11 + FRAC 3',
        phiDays: 'See label',
        notes: 'When lesions are spreading; protect the neck at heading.',
      },
    ],
    culturalPractices: [
      'Grow blast-resistant varieties and use clean seed',
      'Split nitrogen doses; avoid late heavy top-dressing',
      'Keep fields flooded where possible and destroy infected straw',
    ],
  },
  {
    slug: 'wheat-yellow-rust',
    title: 'Wheat — Yellow (Stripe) Rust',
    hostCrop: 'Wheat',
    scientificName: 'Puccinia striiformis f. sp. tritici',
    pathogenType: 'Fungal',
    severityRisk: 'High',
    summary:
      'An airborne rust that spreads across regions in cool, damp springs and strips green leaf area before grain fill.',
    optimalConditions: '10°C–15°C with dew or light rain; survives on volunteer wheat.',
    symptomsChecklist: [
      'Yellow-orange pustules in stripes between leaf veins',
      'Powdery yellow spores rub off on the fingers',
      'Leaves dry out early under heavy infection',
    ],
    biologicalControls: ['No reliable biological control; rely on resistant varieties'],
    chemicalProtocols: [
      {
        activeIngredient: 'Tebuconazole / Prothioconazole',
        fracIracGroup: 'FRAC 3 (DMI)',
        phiDays: '30–35 days',
        notes: 'Spray at first pustules; protect the flag leaf (GS37–39).',
      },
      {
        activeIngredient: 'Azoxystrobin + Propiconazole',
        fracIracGroup: 'FRAC 11 + FRAC 3',
        phiDays: '35 days',
        notes: 'Longer protection where pressure is high.',
      },
    ],
    culturalPractices: [
      'Grow varieties with current resistance ratings and diversify varieties',
      'Remove volunteer wheat to break the green bridge',
      'Scout the top three leaves weekly from tillering',
    ],
  },
  {
    slug: 'cassava-mosaic-disease',
    title: 'Cassava — Mosaic Disease',
    hostCrop: 'Cassava',
    scientificName: 'Cassava mosaic begomoviruses (ACMV, EACMV)',
    pathogenType: 'Viral',
    severityRisk: 'Critical',
    summary:
      'A virus disease spread by infected cuttings and whiteflies that can cut root yield by 20–90%.',
    optimalConditions: 'High whitefly populations and planting of infected cuttings.',
    symptomsChecklist: [
      'Yellow or pale-green mosaic patches on leaves',
      'Twisted, puckered and shrunken leaflets',
      'Stunted plants with small roots',
    ],
    biologicalControls: ['Conserve whitefly natural enemies; neem products on young plants'],
    chemicalProtocols: [],
    culturalPractices: [
      'Plant cuttings only from symptom-free or certified mother plants',
      'Use CMD-resistant varieties',
      'Rogue infected plants in the first 2–3 months',
    ],
  },
  {
    slug: 'banana-fusarium-wilt',
    title: 'Banana — Fusarium Wilt (Panama Disease)',
    hostCrop: 'Banana',
    scientificName: 'Fusarium oxysporum f. sp. cubense (TR4)',
    pathogenType: 'Fungal',
    severityRisk: 'Critical',
    summary:
      'A soil-borne wilt that blocks water transport. The fungus survives in soil for decades and no fungicide cures it.',
    optimalConditions: 'Moved by infested soil, water, tools and planting material.',
    symptomsChecklist: [
      'Yellowing of older leaves from the margins inward',
      'Leaves collapse at the petiole and hang like a skirt',
      'Reddish-brown streaks inside the pseudostem',
    ],
    biologicalControls: ['Trichoderma and Bacillus soil amendments may slow, but do not stop, disease'],
    chemicalProtocols: [],
    culturalPractices: [
      'Destroy infected plants in place and quarantine the area',
      'Disinfect boots, tools and vehicles; do not move soil',
      'Plant certified tissue-culture plantlets and tolerant varieties',
    ],
  },
  {
    slug: 'coffee-leaf-rust',
    title: 'Coffee — Leaf Rust',
    hostCrop: 'Coffee',
    scientificName: 'Hemileia vastatrix',
    pathogenType: 'Fungal',
    severityRisk: 'High',
    summary:
      'The main disease of arabica coffee; heavy infection causes leaf drop and lower yields the following season.',
    optimalConditions: '21°C–25°C with free water on leaves during the rainy season.',
    symptomsChecklist: [
      'Pale yellow spots on the upper leaf surface',
      'Orange powdery pustules on the leaf underside',
      'Premature leaf drop',
    ],
    biologicalControls: ['Moderate shade and balanced nutrition reduce disease pressure'],
    chemicalProtocols: [
      {
        activeIngredient: 'Copper hydroxide / oxychloride',
        fracIracGroup: 'FRAC M01 (Contact)',
        phiDays: 'See label',
        notes: 'Protectant before and early in the rainy season.',
      },
      {
        activeIngredient: 'Cyproconazole',
        fracIracGroup: 'FRAC 3 (DMI)',
        phiDays: 'See label',
        notes: 'Where infection is established.',
      },
    ],
    culturalPractices: [
      'Plant rust-resistant varieties',
      'Prune to open the canopy',
      'Fertilise in balance with crop load',
    ],
  },
  {
    slug: 'citrus-greening',
    title: 'Citrus — Greening (Huanglongbing)',
    hostCrop: 'Citrus',
    scientificName: 'Candidatus Liberibacter asiaticus',
    pathogenType: 'Bacterial / Pest',
    severityRisk: 'Critical',
    summary:
      'An incurable bacterial disease spread by citrus psyllids. Infected trees decline and produce small, bitter, lopsided fruit.',
    optimalConditions: 'Psyllid feeding on new flush; infected budwood.',
    symptomsChecklist: [
      'Blotchy, asymmetric yellow mottle across the leaf midrib',
      'Yellow shoots with corky veins',
      'Small, lopsided fruit that stays green at the base',
    ],
    biologicalControls: ['Tamarixia radiata parasitoid wasps against the Asian citrus psyllid'],
    chemicalProtocols: [
      {
        activeIngredient: 'Imidacloprid / Thiamethoxam',
        fracIracGroup: 'IRAC 4A',
        phiDays: 'See label',
        notes: 'Psyllid control on young flush, coordinated across groves.',
      },
    ],
    culturalPractices: [
      'Plant certified disease-free trees from screened nurseries',
      'Remove infected trees promptly',
      'Report suspected cases to plant protection services',
    ],
  },
];

export function getGuideBySlug(slug: string): AgronomyGuide | undefined {
  return KNOWLEDGE_GUIDES.find((guide) => guide.slug === slug);
}

export type CropGroup = 'Vegetables' | 'Field crops' | 'Orchard & vine' | 'Tropical';

export const CROP_GROUPS: CropGroup[] = ['Vegetables', 'Field crops', 'Orchard & vine', 'Tropical'];

const CROP_GROUP_BY_HOST: Record<string, CropGroup> = {
  Tomato: 'Vegetables',
  Potato: 'Vegetables',
  'Bell Pepper': 'Vegetables',
  'Corn (Maize)': 'Field crops',
  Rice: 'Field crops',
  Wheat: 'Field crops',
  Apple: 'Orchard & vine',
  Grapevine: 'Orchard & vine',
  Citrus: 'Orchard & vine',
  Cassava: 'Tropical',
  Banana: 'Tropical',
  Coffee: 'Tropical',
};

export function getCropGroup(guide: AgronomyGuide): CropGroup {
  return CROP_GROUP_BY_HOST[guide.hostCrop] ?? 'Field crops';
}

export function getDiseaseName(guide: AgronomyGuide): string {
  return guide.title.split('—')[1]?.trim() || guide.title;
}

export function getRelatedGuides(guide: AgronomyGuide, limit = 3): AgronomyGuide[] {
  const group = getCropGroup(guide);
  return KNOWLEDGE_GUIDES.filter((g) => g.slug !== guide.slug)
    .map((g) => ({
      g,
      score: (getCropGroup(g) === group ? 2 : 0) + (g.pathogenType === guide.pathogenType ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ g }) => g);
}
