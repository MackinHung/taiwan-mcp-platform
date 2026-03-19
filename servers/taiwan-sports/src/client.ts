import type { FacilityRecord } from './types.js';

export const SPORT_TYPES = [
  '籃球', '游泳', '健身', '足球', '棒球',
  '網球', '羽球', '桌球', '田徑', '高爾夫',
] as const;

export const CITIES = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
  '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
  '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣',
] as const;

// In-memory sample data for sports facilities across Taiwan.
// In production this would query iPlay or data.gov.tw; here we use
// a comprehensive built-in dataset so the MCP server works offline.
const FACILITY_DATA: FacilityRecord[] = [
  // --- 臺北市 ---
  { id: 'TPE-001', name: '臺北小巨蛋', address: '臺北市松山區南京東路四段2號', phone: '02-25781536', city: '臺北市', district: '松山區', sportTypes: ['籃球', '游泳', '健身', '桌球'], openHours: '06:00-22:00', fee: '依場館公告', lat: 25.0512, lng: 121.5498, facilities: '室內籃球場、游泳池、健身房、桌球室' },
  { id: 'TPE-002', name: '臺北市立大安運動中心', address: '臺北市大安區辛亥路三段55號', phone: '02-23770300', city: '臺北市', district: '大安區', sportTypes: ['游泳', '健身', '羽球', '桌球'], openHours: '06:00-22:00', fee: '游泳全票100元', lat: 25.0211, lng: 121.5368, facilities: '游泳池、健身房、羽球場、桌球室、韻律教室' },
  { id: 'TPE-003', name: '臺北市立中山運動中心', address: '臺北市中山區中山北路二段44號', phone: '02-25218382', city: '臺北市', district: '中山區', sportTypes: ['游泳', '健身', '羽球', '籃球'], openHours: '06:00-22:00', fee: '游泳全票100元', lat: 25.0585, lng: 121.5225, facilities: '游泳池、健身房、羽球場、籃球場' },
  { id: 'TPE-004', name: '臺北田徑場', address: '臺北市松山區敦化北路3號', phone: '02-25704798', city: '臺北市', district: '松山區', sportTypes: ['田徑', '足球'], openHours: '06:00-21:00', fee: '免費', lat: 25.0498, lng: 121.5492, facilities: '400公尺標準田徑跑道、足球場' },
  { id: 'TPE-005', name: '天母棒球場', address: '臺北市士林區忠誠路二段51號', phone: '02-28710809', city: '臺北市', district: '士林區', sportTypes: ['棒球'], openHours: '依賽事公告', fee: '依賽事公告', lat: 25.1156, lng: 121.5283, facilities: '標準棒球場、觀眾席10000人' },
  { id: 'TPE-006', name: '臺北市網球中心', address: '臺北市內湖區民權東路六段185號', phone: '02-27901783', city: '臺北市', district: '內湖區', sportTypes: ['網球'], openHours: '06:00-22:00', fee: '每小時300元', lat: 25.0681, lng: 121.5872, facilities: '室內網球場4面、室外網球場8面' },
  // --- 新北市 ---
  { id: 'NTP-001', name: '新莊體育館', address: '新北市新莊區和興街66號', phone: '02-29972588', city: '新北市', district: '新莊區', sportTypes: ['籃球', '羽球', '桌球'], openHours: '08:00-22:00', fee: '依場館公告', lat: 25.0351, lng: 121.4322, facilities: '多功能體育館、羽球場、桌球室' },
  { id: 'NTP-002', name: '新北市立板橋體育場', address: '新北市板橋區漢生東路278號', phone: '02-29664338', city: '新北市', district: '板橋區', sportTypes: ['田徑', '足球', '籃球'], openHours: '06:00-21:00', fee: '免費', lat: 25.0153, lng: 121.4589, facilities: '田徑場、足球場、籃球場' },
  { id: 'NTP-003', name: '新北市立三重國民運動中心', address: '新北市三重區中正北路1號', phone: '02-29820308', city: '新北市', district: '三重區', sportTypes: ['游泳', '健身', '羽球'], openHours: '06:00-22:00', fee: '游泳全票80元', lat: 25.0615, lng: 121.4882, facilities: '游泳池、健身房、羽球場、韻律教室' },
  // --- 桃園市 ---
  { id: 'TYC-001', name: '桃園市立體育場', address: '桃園市桃園區三民路一段1號', phone: '03-3361132', city: '桃園市', district: '桃園區', sportTypes: ['田徑', '足球'], openHours: '06:00-21:00', fee: '免費', lat: 24.9938, lng: 121.3107, facilities: '標準田徑場、足球場' },
  { id: 'TYC-002', name: '桃園國際棒球場', address: '桃園市中壢區領航北路一段1號', phone: '03-4255926', city: '桃園市', district: '中壢區', sportTypes: ['棒球'], openHours: '依賽事公告', fee: '依賽事公告', lat: 25.0021, lng: 121.2139, facilities: '國際標準棒球場、觀眾席20000人' },
  { id: 'TYC-003', name: '桃園市立國民運動中心', address: '桃園市桃園區大興路32號', phone: '03-3469022', city: '桃園市', district: '桃園區', sportTypes: ['游泳', '健身', '羽球', '桌球'], openHours: '06:00-22:00', fee: '游泳全票80元', lat: 24.9975, lng: 121.3051, facilities: '游泳池、健身房、羽球場、桌球室' },
  // --- 臺中市 ---
  { id: 'TXG-001', name: '臺中洲際棒球場', address: '臺中市北屯區崇德路三段835號', phone: '04-24225279', city: '臺中市', district: '北屯區', sportTypes: ['棒球'], openHours: '依賽事公告', fee: '依賽事公告', lat: 24.1905, lng: 120.6541, facilities: '國際標準棒球場、觀眾席20000人' },
  { id: 'TXG-002', name: '臺中市立朝馬國民運動中心', address: '臺中市西屯區朝馬路700號', phone: '04-22582198', city: '臺中市', district: '西屯區', sportTypes: ['游泳', '健身', '羽球', '籃球'], openHours: '06:00-22:00', fee: '游泳全票80元', lat: 24.1702, lng: 120.6385, facilities: '游泳池、健身房、羽球場、籃球場' },
  { id: 'TXG-003', name: '臺中市網球場', address: '臺中市南區建成路1592號', phone: '04-22636281', city: '臺中市', district: '南區', sportTypes: ['網球'], openHours: '06:00-21:00', fee: '每小時200元', lat: 24.1293, lng: 120.6742, facilities: '室外網球場6面、夜間照明' },
  { id: 'TXG-004', name: '臺中市高爾夫練習場', address: '臺中市大里區中興路二段350號', phone: '04-24068899', city: '臺中市', district: '大里區', sportTypes: ['高爾夫'], openHours: '06:00-22:00', fee: '每籃50元', lat: 24.1025, lng: 120.6891, facilities: '練習打位80席、推桿果嶺' },
  // --- 臺南市 ---
  { id: 'TNN-001', name: '臺南市立棒球場', address: '臺南市南區健康路一段257號', phone: '06-2157691', city: '臺南市', district: '南區', sportTypes: ['棒球'], openHours: '依賽事公告', fee: '依賽事公告', lat: 22.9837, lng: 120.2015, facilities: '標準棒球場、觀眾席12000人' },
  { id: 'TNN-002', name: '臺南市立游泳池', address: '臺南市中西區體育路10號', phone: '06-2284293', city: '臺南市', district: '中西區', sportTypes: ['游泳'], openHours: '06:00-21:00', fee: '全票70元', lat: 22.9895, lng: 120.1972, facilities: '50公尺標準池、兒童池、SPA池' },
  { id: 'TNN-003', name: '臺南市立體育場', address: '臺南市南區體育路10號', phone: '06-2157691', city: '臺南市', district: '南區', sportTypes: ['田徑', '足球', '籃球'], openHours: '06:00-21:00', fee: '免費', lat: 22.9842, lng: 120.1998, facilities: '田徑跑道、足球場、籃球場' },
  // --- 高雄市 ---
  { id: 'KHH-001', name: '高雄巨蛋', address: '高雄市左營區博愛二路757號', phone: '07-5252100', city: '高雄市', district: '左營區', sportTypes: ['籃球', '羽球'], openHours: '依活動公告', fee: '依活動公告', lat: 22.6693, lng: 120.3025, facilities: '多功能體育館、可容納15000人' },
  { id: 'KHH-002', name: '高雄國家體育場', address: '高雄市左營區世運大道100號', phone: '07-5825798', city: '高雄市', district: '左營區', sportTypes: ['田徑', '足球'], openHours: '06:00-21:00', fee: '免費', lat: 22.7013, lng: 120.2965, facilities: '國際標準田徑場、足球場、觀眾席55000人' },
  { id: 'KHH-003', name: '高雄市立中正運動中心', address: '高雄市前鎮區中華五路939號', phone: '07-8225382', city: '高雄市', district: '前鎮區', sportTypes: ['游泳', '健身', '羽球', '桌球'], openHours: '06:00-22:00', fee: '游泳全票80元', lat: 22.6128, lng: 120.3102, facilities: '游泳池、健身房、羽球場、桌球室' },
  { id: 'KHH-004', name: '澄清湖棒球場', address: '高雄市鳥松區大埤路113號', phone: '07-7310887', city: '高雄市', district: '鳥松區', sportTypes: ['棒球'], openHours: '依賽事公告', fee: '依賽事公告', lat: 22.6592, lng: 120.3598, facilities: '標準棒球場、觀眾席20000人' },
  // --- 新竹市 ---
  { id: 'HSC-001', name: '新竹市立體育館', address: '新竹市東區公園路295號', phone: '03-5319009', city: '新竹市', district: '東區', sportTypes: ['籃球', '羽球', '桌球'], openHours: '08:00-22:00', fee: '依場館公告', lat: 24.8067, lng: 120.9748, facilities: '綜合體育館、羽球場、桌球室' },
  { id: 'HSC-002', name: '新竹市立游泳池', address: '新竹市東區食品路200號', phone: '03-5625645', city: '新竹市', district: '東區', sportTypes: ['游泳'], openHours: '06:00-21:00', fee: '全票70元', lat: 24.8021, lng: 120.9811, facilities: '50公尺標準池、溫水池' },
  // --- 彰化縣 ---
  { id: 'CHA-001', name: '彰化縣立體育場', address: '彰化縣彰化市健興路1號', phone: '04-7222744', city: '彰化縣', district: '彰化市', sportTypes: ['田徑', '足球', '籃球'], openHours: '06:00-21:00', fee: '免費', lat: 24.0752, lng: 120.5409, facilities: '田徑場、足球場、籃球場' },
  // --- 屏東縣 ---
  { id: 'PIF-001', name: '屏東縣立體育館', address: '屏東縣屏東市公裕街36號', phone: '08-7363685', city: '屏東縣', district: '屏東市', sportTypes: ['籃球', '羽球', '桌球'], openHours: '08:00-21:00', fee: '依場館公告', lat: 22.6726, lng: 120.4888, facilities: '綜合體育館、羽球場、桌球室' },
  // --- 宜蘭縣 ---
  { id: 'ILN-001', name: '宜蘭運動公園', address: '宜蘭縣宜蘭市公園路66號', phone: '03-9322440', city: '宜蘭縣', district: '宜蘭市', sportTypes: ['游泳', '網球', '田徑'], openHours: '06:00-21:00', fee: '游泳全票60元', lat: 24.7517, lng: 121.7526, facilities: '游泳池、網球場、田徑場' },
  // --- 花蓮縣 ---
  { id: 'HLN-001', name: '花蓮縣立體育場', address: '花蓮縣花蓮市達固湖灣大路26號', phone: '03-8227171', city: '花蓮縣', district: '花蓮市', sportTypes: ['田徑', '足球', '棒球'], openHours: '06:00-21:00', fee: '免費', lat: 23.9852, lng: 121.6054, facilities: '田徑場、足球場、棒球場' },
  // --- 臺東縣 ---
  { id: 'TTT-001', name: '臺東縣立體育場', address: '臺東縣臺東市南京路103號', phone: '089-334772', city: '臺東縣', district: '臺東市', sportTypes: ['田徑', '足球'], openHours: '06:00-21:00', fee: '免費', lat: 22.7553, lng: 121.1448, facilities: '田徑場、足球場' },
  // --- 高爾夫 additional ---
  { id: 'TPE-007', name: '美麗華高爾夫鄉村俱樂部', address: '臺北市北投區下東勢產業道路', phone: '02-28617511', city: '臺北市', district: '北投區', sportTypes: ['高爾夫'], openHours: '06:00-18:00', fee: '平日3600元/假日5200元', lat: 25.1332, lng: 121.5182, facilities: '18洞標準球場、練習場、餐廳' },
  // --- additional swim/fitness ---
  { id: 'NTP-004', name: '新北市立永和國民運動中心', address: '新北市永和區民生路304號', phone: '02-22311769', city: '新北市', district: '永和區', sportTypes: ['游泳', '健身', '桌球'], openHours: '06:00-22:00', fee: '游泳全票80元', lat: 25.0102, lng: 121.5158, facilities: '游泳池、健身房、桌球室' },
];

export function getAllFacilities(): readonly FacilityRecord[] {
  return FACILITY_DATA;
}

export function searchByCity(city: string): FacilityRecord[] {
  const normalizedCity = normalizeCity(city);
  return FACILITY_DATA.filter((f) => normalizeCity(f.city) === normalizedCity);
}

export function searchBySportType(sportType: string): FacilityRecord[] {
  return FACILITY_DATA.filter((f) =>
    f.sportTypes.some((s) => s.includes(sportType))
  );
}

export function searchByKeyword(keyword: string): FacilityRecord[] {
  const kw = keyword.toLowerCase();
  return FACILITY_DATA.filter(
    (f) =>
      f.name.toLowerCase().includes(kw) ||
      f.address.toLowerCase().includes(kw) ||
      f.facilities.toLowerCase().includes(kw) ||
      f.sportTypes.some((s) => s.toLowerCase().includes(kw))
  );
}

export function searchFacilities(params: {
  sportType?: string;
  city?: string;
  keyword?: string;
}): FacilityRecord[] {
  let results = [...FACILITY_DATA];

  if (params.city) {
    const normalizedCity = normalizeCity(params.city);
    results = results.filter((f) => normalizeCity(f.city) === normalizedCity);
  }

  if (params.sportType) {
    results = results.filter((f) =>
      f.sportTypes.some((s) => s.includes(params.sportType!))
    );
  }

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        f.address.toLowerCase().includes(kw) ||
        f.facilities.toLowerCase().includes(kw)
    );
  }

  return results;
}

export function findFacilityByName(name: string): FacilityRecord | undefined {
  // Exact match first
  const exact = FACILITY_DATA.find((f) => f.name === name);
  if (exact) return exact;

  // Partial match
  return FACILITY_DATA.find((f) => f.name.includes(name) || name.includes(f.name));
}

export function searchNearby(
  lat: number,
  lng: number,
  radiusKm: number = 2
): Array<FacilityRecord & { distanceKm: number }> {
  return FACILITY_DATA
    .map((f) => ({
      ...f,
      distanceKm: haversineDistance(lat, lng, f.lat, f.lng),
    }))
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getSportTypeSummary(): Array<{ sportType: string; count: number }> {
  const countMap = new Map<string, number>();
  for (const sportType of SPORT_TYPES) {
    const count = FACILITY_DATA.filter((f) =>
      f.sportTypes.includes(sportType)
    ).length;
    countMap.set(sportType, count);
  }

  return Array.from(countMap.entries())
    .map(([sportType, count]) => ({ sportType, count }))
    .sort((a, b) => b.count - a.count);
}

// --- Internal helpers ---

function normalizeCity(city: string): string {
  return city
    .replace('台北', '臺北')
    .replace('台中', '臺中')
    .replace('台南', '臺南')
    .replace('台東', '臺東');
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
