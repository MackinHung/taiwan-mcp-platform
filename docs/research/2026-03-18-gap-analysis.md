# Taiwan MCP Server Gap Analysis
**Research Date**: 2026-03-18
**Status**: Phase 1 Complete - Global Ecosystem Mapping

---

## Executive Summary

This analysis identifies gaps in Taiwan's MCP server coverage by comparing our 32 existing servers against the global MCP ecosystem (19,503+ servers on Glama.ai). The research reveals **12 high-priority gaps** where Taiwan-specific implementations would provide unique value beyond global alternatives.

**Key Finding**: Most global categories (maps, social media, e-commerce) have mature international solutions, but Taiwan's unique data landscape creates opportunities in domains where local government data, Chinese-language processing, or Taiwan-specific regulations provide competitive moats.

---

## Methodology

### Research Sources
1. **MCP Registries**: [Glama.ai](https://glama.ai/mcp/servers) (19,503 servers), [mcp.so](https://mcp.so/) (call volume rankings), [Smithery](https://smithery.ai/) (curated marketplace)
2. **Global Ecosystem**: GitHub stars analysis, category popularity metrics
3. **Taiwan Data Landscape**: data.gov.tw portal, government API availability, local platform dominance

### Evaluation Criteria
For each gap, we assess:
- **Taiwan Value-Add**: Does Taiwan-specific data provide unique benefits?
- **Data Availability**: Is government/public data accessible via APIs?
- **User Demand**: Would Taiwan users specifically benefit vs. global alternatives?
- **Competitive Moat**: Can we build defensible advantages (language, regulation, data exclusivity)?

---

## Global MCP Ecosystem Overview

### Most Popular Categories (Glama.ai, 2026)
1. **Developer Tools** (6,926 servers) - Dominated by code execution, testing, CI/CD
2. **Search** (3,609 servers) - Web search, document search, semantic search
3. **App Automation** (3,577 servers) - Workflow orchestration, RPA
4. **RAG Systems** (1,804 servers) - Document retrieval, knowledge bases
5. **Finance** (993 servers) - Trading, crypto, banking APIs
6. **Communication** (862 servers) - Email, messaging, notifications
7. **Research & Data** (845 servers) - Academic papers, datasets, analytics
8. **Browser Automation** (815 servers) - Web scraping, testing

### Taiwan's Coverage
✅ **Covered**: Weather, air quality, government data (open data, law, budget, tax), transit, food safety, health (hospital, drug, CDC), business (company, stock, invoice), utilities (electricity, oil, reservoir), public records (land registry, customs, patents)

❌ **Gaps Identified**: Education, tourism, job recruitment, e-commerce price comparison, sports, entertainment, fitness, LINE/messaging integration, local maps enhancement

---

## Gap Analysis: High-Priority Opportunities

### Tier 1: Critical Gaps (Immediate Development)

#### 1. **Taiwan Education MCP Server** 🎓
**Why Taiwan-Specific**:
- MOE scholarship programs (Taiwan Scholarship, Huayu Enrichment) with 40,000+ NTD/semester + living allowance
- University course catalogs in Traditional Chinese
- K-12 curriculum standards, exam schedules (學測, 指考, 統測)
- Study abroad programs, exchange opportunities

**Data Sources**:
- [MOE Taiwan Scholarship Portal](https://taiwanscholarship.moe.gov.tw/)
- [MOE Open Data](https://english.moe.gov.tw/) - School directories, statistics
- University APIs (academic calendars, course offerings)

**Global Comparison**: Education Data MCP (US Urban Institute) exists but focuses on US K-12/college data. **No Taiwan equivalent**.

**Proposed Tools**:
- `search_scholarships` - Query MOE scholarships by eligibility, field, university
- `find_universities` - Search Taiwan universities by program, location, ranking
- `get_exam_schedule` - Retrieve national exam dates and registration deadlines
- `check_course_equivalency` - Cross-reference course credits for transfers

**Implementation Priority**: **HIGH** - Government data available, clear user need (international students + Taiwan families)

---

#### 2. **Taiwan Tourism MCP Server** 🏞️
**Why Taiwan-Specific**:
- [Tourism Bureau Open Data](https://data.gov.tw/en/datasets/7777) - 10,000+ attractions with GIS coordinates
- [Catering/Restaurant Data](https://data.gov.tw/en/datasets/7779) - Local eateries, night markets
- [Activities Dataset](https://data.gov.tw/en/datasets/7778) - Festivals, events, seasonal activities
- Traditional Chinese place names, cultural context (e.g., temple history)

**Data Sources**:
- Tourism Administration [data.gov.tw](https://data.gov.tw/en/datasets/7777)
- Taipei Travel [Open Data](https://www.travel.taipei/en/open-data)
- Tourism Data Standard V2.0 (government schema)

**Global Comparison**: TripAdvisor MCP, Korea Tourism MCP exist. **No Taiwan equivalent** despite excellent government data.

**Proposed Tools**:
- `search_attractions` - Find scenic spots by region, category, accessibility
- `find_restaurants` - Search eateries by cuisine, location, price range
- `get_events` - Retrieve festivals, activities by date range
- `plan_itinerary` - Generate multi-day routes with transit times

**Implementation Priority**: **HIGH** - Rich government data, tourism is major Taiwan industry (11M visitors in 2024)

---

#### 3. **Taiwan Job Recruitment MCP Server** 💼
**Why Taiwan-Specific**:
- [104 Job Bank](https://go.104.com.tw/expats/) - 1.14M+ jobs, 57K companies, #43 most visited site in Taiwan
- [1111 Job Bank](https://www.1111.com.tw/Expats) - 70K vacancies, regional focus
- Bilingual support for foreign professionals
- Taiwan labor law context (base salary, leave policies)

**Data Sources**:
- 104/1111 public job listings (scraping or API partnerships)
- [Taiwan Job Bank](https://www.taiwanjobs.gov.tw/) (government portal)
- Work permit requirements (MOL data)

**Global Comparison**: Indeed MCP, LinkedIn MCP exist. **Taiwan-specific value**:
- 104 dominates Taiwan market (80%+ share vs. LinkedIn's <5%)
- Traditional Chinese job descriptions
- Taiwan labor law integration (mandatory salary ranges, benefits)

**Proposed Tools**:
- `search_jobs` - Query 104/1111 by keyword, location, salary, experience
- `get_job_details` - Retrieve full JD, company info, application contact
- `check_work_permit` - Validate foreign worker eligibility by job category
- `analyze_salary_trends` - Benchmark compensation by industry/role

**Implementation Priority**: **HIGH** - Clear user need (job seekers + recruiters), dominant local platforms

---

#### 4. **Taiwan Sports MCP Server** ⚾
**Why Taiwan-Specific**:
- [CPBL (Chinese Professional Baseball League)](https://en.cpbl.com.tw/) - Taiwan's #1 sport, 6 teams, 120-game season
- [P.LEAGUE+](https://pleagueofficial.com/) (basketball), [T1 League](https://t1league.com/) (basketball)
- Real-time scores, player stats, game schedules
- Traditional Chinese commentary, team names

**Data Sources**:
- [CPBL Stats](http://cpblstats.com/) - Daily statistics, news
- [Flashscore Taiwan](https://www.flashscoreusa.com/baseball/taiwan/cpbl/) - Live scores
- [Sofascore CPBL](https://www.sofascore.com/baseball/tournament/chinese-taipei/cpbl/11196) - Match details

**Global Comparison**: ESPN MCP covers 25+ leagues but **CPBL not included**. NBA MCP exists but not P.LEAGUE+/T1.

**Proposed Tools**:
- `get_cpbl_scores` - Fetch live/recent game scores
- `get_player_stats` - Retrieve batting/pitching statistics
- `get_team_standings` - Current league rankings
- `get_schedule` - Upcoming games by team/date

**Implementation Priority**: **MEDIUM-HIGH** - Passionate fanbase, CPBL is cultural touchstone, ESPN gap

---

#### 5. **Taiwan LINE Integration MCP Server** 💬
**Why Taiwan-Specific**:
- [LINE dominates Taiwan messaging](https://www.statista.com/statistics/968238/taiwan-communication-software-usage/) - **77.56% market share** (Facebook Messenger: 3.6%)
- LINE Pay (digital wallet), LINE Today (news), LINE TV (streaming)
- Business Official Accounts - 86% of population uses LINE for brand communication

**Data Sources**:
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/overview/) - Official developer platform
- LINE Notify - Push notifications
- LIFF (LINE Front-end Framework) - Mini-apps

**Global Comparison**: Social media MCPs focus on Twitter/LinkedIn/Instagram. **LINE MCP does not exist globally** (LINE is Asia-only).

**Proposed Tools**:
- `send_line_message` - Send messages via LINE Notify/Messaging API
- `create_line_bot` - Deploy chatbot to LINE Official Account
- `get_line_profile` - Retrieve user profile data (with consent)
- `send_flex_message` - Rich message templates (carousels, buttons)

**Implementation Priority**: **HIGH** - Dominant platform in Taiwan, no global alternative, clear B2B use case

---

### Tier 2: Valuable Additions (Secondary Development)

#### 6. **Taiwan E-Commerce Price Comparison MCP Server** 🛒
**Why Taiwan-Specific**:
- [Shopee Taiwan](https://shopee.tw/) - 61% user preference, 29M monthly users
- [Momo Shopping](https://www.momoshop.com.tw/) - 59% preference, 29M users
- [PChome 24h](https://24h.pchome.com.tw/) - 43% preference, 24-hour delivery guarantee
- Price wars, flash sales, Taiwan-specific discounts

**Data Sources**:
- Public product listings (web scraping with rate limits)
- Affiliate APIs (if available)
- Price history tracking

**Global Comparison**: Amazon MCP exists. **Taiwan value-add**:
- Shopee/Momo dominate (Amazon Taiwan is niche)
- Cross-platform price comparison (3+ major platforms)
- Taiwan-specific promotions (Singles' Day, 618 Shopping Festival)

**Proposed Tools**:
- `search_products` - Cross-platform product search
- `compare_prices` - Price comparison across Shopee/Momo/PChome
- `track_price_history` - Historical price trends
- `get_deals` - Current promotions, coupons

**Implementation Priority**: **MEDIUM** - High user demand but scraping complexity, legal considerations

---

#### 7. **Taiwan Movie & Entertainment MCP Server** 🎬
**Why Taiwan-Specific**:
- [VieShow (威秀) Cinemas](https://www.vieshow.com/) - Leading chain, 50+ screens nationwide
- [Showtime Cinemas](https://www.showtimes.com.tw/) - Budget-friendly option
- Taiwan film releases (local + international), Traditional Chinese subtitles
- Integration with 7-11 iBon ticket booking

**Data Sources**:
- Cinema showtime APIs (VieShow, Ambassador, Showtime)
- [TaiwanCinema.com](http://www.taiwancinema.com/) - Film database
- 7-11 iBon API (if available)

**Global Comparison**: IMDb MCP, TMDB MCP exist. **Taiwan value-add**:
- Local cinema showtimes (global APIs don't cover Taiwan theaters)
- 7-11 ticket booking integration (unique to Taiwan)
- Taiwan film industry data

**Proposed Tools**:
- `get_showtimes` - Movie schedules by cinema, date
- `search_movies` - Film info, ratings, trailers
- `book_tickets` - 7-11 iBon integration (if API available)
- `find_nearby_cinemas` - Location-based search

**Implementation Priority**: **MEDIUM** - Nice-to-have but not critical, depends on API availability

---

#### 8. **Taiwan Fitness & Wellness MCP Server** 💪
**Why Taiwan-Specific**:
- [World Gym Taiwan](https://www.worldgymtaiwan.com/en/) - 117 outlets, 20+ years market leader
- Fitness culture: yoga, pilates, boxing, CrossFit studios
- Health tracking integrated with Taiwan NHI (National Health Insurance) data

**Data Sources**:
- World Gym App API (membership, class schedules, locations)
- Studio class aggregators (ClassPass-style platforms)
- NHI health records (privacy-compliant access)

**Global Comparison**: Personal Health Tracker MCP, MyFitnessPal MCP exist. **Taiwan value-add**:
- World Gym dominance (117 locations vs. global gyms)
- Taiwan-specific class schedules, trainers
- NHI integration for holistic health tracking

**Proposed Tools**:
- `find_gyms` - Search World Gym locations, amenities
- `get_class_schedule` - Group fitness class times
- `book_class` - Reserve gym classes
- `track_workouts` - Integrate with NHI health data

**Implementation Priority**: **LOW-MEDIUM** - Niche audience, depends on gym API partnerships

---

#### 9. **Taiwan Calendar & Events MCP Server** 📅
**Why Taiwan-Specific**:
- Taiwan public holidays (ROC calendar, Lunar New Year, Dragon Boat Festival)
- Government announcements (typhoon days, air quality alerts)
- Cultural events (temple festivals, night market schedules)

**Data Sources**:
- Government holiday calendar (data.gov.tw)
- CWA (Central Weather Administration) alerts
- Event aggregators (Accupass, KKTIX)

**Global Comparison**: Google Calendar MCP, Outlook Calendar MCP exist. **Taiwan value-add**:
- ROC calendar integration (民國年份)
- Typhoon day announcements (school/work closures)
- Lunar calendar events

**Proposed Tools**:
- `get_public_holidays` - Taiwan ROC calendar
- `check_typhoon_day` - Work/school closure status
- `get_lunar_calendar` - Traditional festivals, auspicious dates
- `find_events` - Cultural activities, concerts, exhibitions

**Implementation Priority**: **MEDIUM** - Useful utility, government data available

---

### Tier 3: Nice-to-Have (Future Consideration)

#### 10. **Taiwan Maps Enhancement MCP Server** 🗺️
**Why Taiwan-Specific**:
- Google Maps works well in Taiwan but lacks:
  - Real-time bus/MRT arrival (requires Taipei/Kaohsiung transit APIs)
  - Youbike/WeMo scooter availability
  - Hiking trail conditions (Taiwan has 300+ trails)

**Data Sources**:
- [Taipei Transit API](https://data.gov.tw/dataset/33430) - Bus/MRT real-time
- [Youbike API](https://data.gov.tw/dataset/137993) - Bike availability
- [Taiwan Trails](https://hiking.biji.co/) - Hiking routes, conditions

**Global Comparison**: Google Maps MCP, TomTom MCP exist. **Taiwan value-add**:
- Micro-mobility (Youbike, WeMo scooters) - not in Google Maps
- Trail conditions (landslide alerts, seasonal closures)
- Traditional Chinese POI names

**Proposed Tools**:
- `get_bus_arrival` - Real-time bus ETA
- `find_youbike_stations` - Bike availability by location
- `check_trail_status` - Hiking route conditions
- `search_poi` - Traditional Chinese place name search

**Implementation Priority**: **LOW** - Google Maps already strong, incremental improvements only

---

#### 11. **Taiwan Translation & Localization MCP Server** 🌐
**Why Taiwan-Specific**:
- Traditional Chinese (繁體中文) vs. Simplified (簡體)
- Taiwan-specific terms (計程車 vs. 的士, 捷運 vs. 地鐵)
- Mandarin-Taiwanese Hokkien-Hakka-Indigenous language translation

**Data Sources**:
- MOE Dictionary of Chinese (萌典)
- Taiwanese Hokkien translation databases
- Government translation standards

**Global Comparison**: DeepL MCP, Lara Translate MCP exist. **Taiwan value-add**:
- Traditional Chinese nuances (Taiwan vs. Hong Kong usage)
- Taiwanese Hokkien/Hakka (not supported by global services)
- Government terminology standards

**Proposed Tools**:
- `translate_text` - Mandarin ↔ English with Taiwan context
- `localize_content` - Adapt Simplified Chinese to Traditional
- `translate_hokkien` - Taiwanese Hokkien ↔ Mandarin
- `validate_terminology` - Check government-approved translations

**Implementation Priority**: **LOW** - DeepL already excellent, niche use case

---

#### 12. **Taiwan Government E-Services MCP Server** 🏛️
**Why Taiwan-Specific**:
- [e-Government Portal](https://www.gov.tw/) - 3,000+ online services
- Tax filing (National Taxation Bureau)
- Health insurance queries (NHI)
- Vehicle registration (Motor Vehicles Office)

**Data Sources**:
- [data.gov.tw](https://data.gov.tw/en) - Government open data
- e-Service APIs (tax, NHI, vehicle registration)
- Digital certificate integration (自然人憑證)

**Global Comparison**: GovInfo MCP (US), Data.gov MCP (US) exist. **No Taiwan equivalent**.

**Proposed Tools**:
- `check_tax_status` - Query tax filing, refund status
- `get_nhi_coverage` - Health insurance eligibility, claims
- `verify_vehicle_registration` - License plate, inspection dates
- `find_government_forms` - Search/download official forms

**Implementation Priority**: **MEDIUM** - Useful but requires API partnerships, digital certificate complexity

---

## Gaps That Are NOT Priorities

### ❌ **Why We're Skipping These Categories**

#### 1. **General Social Media Aggregation**
- **Reason**: LINE MCP (Tier 1) covers Taiwan's dominant platform. Twitter/Facebook/Instagram MCPs already exist globally and work fine in Taiwan.
- **No Taiwan-specific value**: Same APIs, same data, no regulatory/language advantages.

#### 2. **Global Travel Booking**
- **Reason**: Amadeus MCP, Booking.com MCP, Expedia APIs already excellent.
- **Taiwan tourism data covered**: See Tier 1 Tourism MCP for local attractions/restaurants.

#### 3. **International Sports**
- **Reason**: ESPN MCP covers NFL, NBA, MLB, soccer. Only CPBL/P.LEAGUE+ need Taiwan server (Tier 1).

#### 4. **Generic Utility Bills Payment**
- **Reason**: Payment APIs are bank/financial institution-specific, not MCP-suitable.
- **Taiwan electricity covered**: We already have `taiwan-electricity` server for usage data.

#### 5. **Real Estate (Beyond Housing)**
- **Reason**: We're already discussing `taiwan-housing` server (rent/sale listings). Additional real estate data (land value, zoning) is niche.

---

## Implementation Roadmap

### **Phase 1: Foundation (Q2 2026)** - Tier 1 Servers
1. ✅ **taiwan-education** - MOE scholarships, university data
2. ✅ **taiwan-tourism** - Attractions, restaurants, events
3. ✅ **taiwan-job** - 104/1111 job listings, salary data

**Rationale**: Government data readily available, clear user demand, no global alternatives.

### **Phase 2: Platform Integration (Q3 2026)** - Tier 1 + Tier 2
4. ✅ **taiwan-line** - LINE Messaging API, LINE Pay integration
5. ✅ **taiwan-sports** - CPBL scores, P.LEAGUE+ stats
6. ✅ **taiwan-ecommerce** - Shopee/Momo price comparison (if legal)

**Rationale**: High user demand, requires API partnerships or careful scraping compliance.

### **Phase 3: Expansion (Q4 2026)** - Tier 2 + Tier 3
7. ✅ **taiwan-movie** - Cinema showtimes, 7-11 ticket booking
8. ✅ **taiwan-calendar** - ROC calendar, typhoon days
9. ✅ **taiwan-gov-services** - Tax, NHI, vehicle registration (if APIs available)

**Rationale**: Nice-to-have utilities, depends on API availability and partnerships.

### **Phase 4: Polish (2027+)** - Tier 3 + Niche
10. 🔄 **taiwan-maps-enhancement** - Youbike, trail conditions
11. 🔄 **taiwan-fitness** - World Gym classes, NHI integration
12. 🔄 **taiwan-translation** - Hokkien/Hakka, Taiwan terminology

**Rationale**: Incremental improvements, niche audiences, lower ROI.

---

## Competitive Moats Analysis

### **Where Taiwan MCP Servers Win**

| Domain | Moat Strength | Reason |
|--------|---------------|--------|
| **Education** | 🛡️🛡️🛡️ **STRONG** | MOE data exclusive, Traditional Chinese, Taiwan scholarship rules |
| **Tourism** | 🛡️🛡️🛡️ **STRONG** | Government open data, Traditional Chinese place names, local context |
| **Job Recruitment** | 🛡️🛡️🛡️ **STRONG** | 104/1111 dominate (80%+ vs. LinkedIn's <5%), Taiwan labor law |
| **LINE Integration** | 🛡️🛡️🛡️ **STRONG** | LINE Asia-only, 77% Taiwan market share, no global alternative |
| **Sports (CPBL)** | 🛡️🛡️ **MEDIUM** | CPBL not in ESPN MCP, passionate fanbase, Traditional Chinese |
| **E-Commerce** | 🛡️🛡️ **MEDIUM** | Shopee/Momo dominate, price comparison niche (legal risk) |
| **Calendar/Events** | 🛡️ **WEAK** | ROC calendar niche, typhoon days useful but limited demand |
| **Maps Enhancement** | 🛡️ **WEAK** | Google Maps already strong, incremental Youbike/trails data |

### **Why Global Alternatives Beat Us**

| Domain | Global Winner | Taiwan Can't Compete |
|--------|---------------|----------------------|
| **Social Media** | Twitter/Facebook/Instagram MCPs | No Taiwan-specific data advantage |
| **Translation** | DeepL MCP | Already supports Traditional Chinese well |
| **Calendar** | Google Calendar MCP | Works perfectly for most Taiwan users |
| **Travel Booking** | Booking.com/Amadeus MCPs | Global hotel/flight inventory |
| **Fitness Tracking** | MyFitnessPal MCP | International food database, health standards |

---

## Next Steps

### **Immediate Actions** (Week of 2026-03-18)
1. ✅ **Validate data sources**: Confirm MOE scholarship API, Tourism Bureau data format, 104 Job Bank scraping feasibility
2. ✅ **Legal review**: E-commerce scraping (Shopee/Momo ToS), LINE API terms, 7-11 iBon integration
3. ✅ **Prototype Tier 1 servers**: Start with `taiwan-education` (easiest data access) to test MCP factory pipeline

### **Research Gaps to Fill**
1. 🔍 **CPBL API**: Does CPBL offer official API or must we scrape?
2. 🔍 **104/1111 APIs**: Partnership opportunities or public APIs?
3. 🔍 **LINE Official Account requirements**: Costs, approval process, API rate limits
4. 🔍 **E-commerce legal**: Can we legally scrape Shopee/Momo for price comparison?

### **Stakeholder Discussions**
1. 📞 **Taiwan Tourism Bureau**: Partnership for official API access
2. 📞 **MOE**: Scholarship data integration, update frequency
3. 📞 **104 Job Bank**: API partnership or data licensing
4. 📞 **LINE Taiwan**: Official Account setup, API quotas

---

## Appendix: Data Source Inventory

### Government Data (data.gov.tw)
- ✅ **Tourism**: [Attractions](https://data.gov.tw/en/datasets/7777), [Restaurants](https://data.gov.tw/en/datasets/7779), [Activities](https://data.gov.tw/en/datasets/7778)
- ✅ **Transit**: [Taipei Bus/MRT](https://data.gov.tw/dataset/33430), [Youbike](https://data.gov.tw/dataset/137993)
- ✅ **Weather**: CWA (Central Weather Administration) already covered
- ✅ **Health**: NHI, CDC already covered
- ⏳ **Education**: MOE scholarship portal, university directories

### Private Platform APIs
- ⏳ **LINE**: [Messaging API](https://developers.line.biz/en/docs/messaging-api/overview/), LINE Notify
- ⏳ **104 Job Bank**: Public listings (scraping), potential API partnership
- ⏳ **1111 Job Bank**: Public listings (scraping)
- ⏳ **Shopee/Momo**: Product listings (scraping, legal risk)
- ⏳ **CPBL**: [Stats site](http://cpblstats.com/), potential API partnership
- ⏳ **VieShow Cinemas**: Showtime data (scraping, Mandarin-only interface)

### Global APIs We Can Leverage
- ✅ **Google Maps API**: Geocoding, routing (enhance with Taiwan transit data)
- ✅ **DeepL API**: Translation (supplement with Taiwan-specific terminology)
- ✅ **OpenStreetMap**: POI data, hiking trails

---

## Conclusion

**12 high-priority gaps identified**, with **5 Tier 1 servers** recommended for immediate development:

1. **taiwan-education** - MOE scholarships, university data (STRONG moat)
2. **taiwan-tourism** - Government attractions/restaurants/events (STRONG moat)
3. **taiwan-job** - 104/1111 job listings (STRONG moat)
4. **taiwan-sports** - CPBL/P.LEAGUE+ scores (MEDIUM moat)
5. **taiwan-line** - LINE Messaging API integration (STRONG moat)

**Key Insight**: Taiwan MCP servers succeed where **local data exclusivity + language + regulation** create moats. Generic categories (maps, social media, translation) are already well-served by global alternatives. Focus on Taiwan-first domains where government data and local platforms dominate.

---

**Next Document**: `2026-03-18-tier1-implementation-plan.md` - Detailed specs for Tier 1 servers

---

## Sources

### MCP Ecosystem
- [Popular MCP Servers | Glama](https://glama.ai/mcp/servers)
- [7 MCP Registries Worth Checking Out | Nordic APIs](https://nordicapis.com/7-mcp-registries-worth-checking-out/)
- [Top MCP Servers | Smithery](https://github.com/pedrojaques99/popular-mcp-servers)
- [MCP Servers: 79,017 stars | The Agent Times](https://theagenttimes.com/articles/mcp-servers-79017-stars)

### Education
- [Education Data MCP Server | Awesome MCP Servers](https://mcpservers.org/servers/ckz/edu_data_mcp_server)
- [MCP Architecture Guide for Higher Education | ibl.ai](https://ibl.ai/solutions/higher-education/mcp-guide)
- [Taiwan Scholarship Program | MOE](https://english.moe.gov.tw/cp-24-16833-23C09-1.html)

### Tourism
- [Travel MCP Server | Awesome MCP Servers](https://mcpservers.org/en/servers/gs-ysingh/travel-mcp-server)
- [MCP Servers in Travel | AltexSoft](https://www.altexsoft.com/blog/mcp-servers-travel/)
- [Taiwan Tourism Open Data | data.gov.tw](https://data.gov.tw/en/datasets/7777)

### Social Media & Messaging
- [5 Best MCP Servers for Social Media | OpenTweet](https://opentweet.io/blog/best-mcp-servers-social-media-2026)
- [LINE Messaging API | LivePerson](https://www.liveperson.com/products/line/)
- [Popular instant messaging platforms in Taiwan | Statista](https://www.statista.com/statistics/968238/taiwan-communication-software-usage/)

### Maps & Navigation
- [Google Maps MCP Server | Anthropic](https://www.pulsemcp.com/servers/modelcontextprotocol-google-maps)
- [Mapbox MCP Server | Mapbox Blog](https://www.mapbox.com/blog/introducing-the-mapbox-model-context-protocol-mcp-server)

### Job Recruitment
- [LinkedIn Job Search MCP | GitHub](https://github.com/Hritik003/linkedin-mcp)
- [Indeed's MCP server | Indeed Docs](https://docs.indeed.com/mcp/)
- [104 Job Bank](https://go.104.com.tw/expats/)

### E-Commerce
- [Amazon MCP Server | GitHub](https://github.com/Fewsats/amazon-mcp)
- [Top 10 E-commerce Platforms in Taiwan | EasyParcel](https://blog.easyparcel.com/my/ecommerce-platform-taiwan/)

### Sports
- [ESPN MCP Server | Apify](https://apify.com/mrbridge/espn-mcp-server)
- [CPBL Official Site](https://en.cpbl.com.tw/)
- [CPBL Stats](http://cpblstats.com/)

### Entertainment
- [IMDb MCP Server | GitHub](https://github.com/uzaysozen/imdb-mcp-server)
- [Best Cinemas in Taipei | Taipei Travel Geek](https://www.taipeitravelgeek.com/best-cinemas-in-taipei)

### Translation
- [DeepL MCP Server | DeepL Docs](https://developers.deepl.com/docs/learning-how-tos/examples-and-guides/deepl-mcp-server-how-to-build-and-use-translation-in-llm-applications)
- [Lara Translate MCP Server](https://support.laratranslate.com/en/lara-translate-mcp-server)

### Government Data
- [AI Agents Meet Federal Data | GovInfo](https://www.govinfo.gov/features/mcp-public-preview)
- [Data.gov MCP Server | GitHub](https://github.com/melaodoidao/datagov-mcp-server)
- [Taiwan Government Open Data | data.gov.tw](https://data.gov.tw/en)

### Fitness & Health
- [Personal Health Tracker MCP | Playbooks](https://playbooks.com/mcp/evangstav-personal-health-tracker)
- [World Gym Taiwan](https://www.worldgymtaiwan.com/en/)

### Calendar & Events
- [Google Calendar MCP | GitHub](https://github.com/nspady/google-calendar-mcp)
- [Outlook Calendar MCP | PulseMCP](https://www.pulsemcp.com/servers/merajmehrabi-outlook-calendar)

### Environment Monitoring
- [AQICN MCP Server | LangDB](https://langdb.ai/app/mcp-servers/aqicn-mcp-server-27941a76-d198-4f65-9bca-72cbe0598066)

### Public Records
- [FOIA Gras | Government Transparency](https://foiagras.com/mcp/)
- [Archive.org advanced search MCP | Apify](https://apify.com/maged120/archive-org-advanced-search/api/mcp)
