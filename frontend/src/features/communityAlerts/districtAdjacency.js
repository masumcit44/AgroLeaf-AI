// Canonical 64-District Adjacency Graph & Spatial Relations for Bangladesh
// Derived from authoritative BBS administrative boundary polygons.
// Used by F32 Outbreak Early Warning to propagate spatial neighbor risk alerts.

export const DISTRICT_INFO = {
  "1": {
    "nameEn": "Dhaka",
    "nameBn": "ঢাকা"
  },
  "2": {
    "nameEn": "Faridpur",
    "nameBn": "ফরিদপুর"
  },
  "3": {
    "nameEn": "Gazipur",
    "nameBn": "গাজীপুর"
  },
  "4": {
    "nameEn": "Gopalganj",
    "nameBn": "গোপালগঞ্জ"
  },
  "5": {
    "nameEn": "Jamalpur",
    "nameBn": "জামালপুর"
  },
  "6": {
    "nameEn": "Kishoreganj",
    "nameBn": "কিশোরগঞ্জ"
  },
  "7": {
    "nameEn": "Madaripur",
    "nameBn": "মাদারীপুর"
  },
  "8": {
    "nameEn": "Manikganj",
    "nameBn": "মানিকগঞ্জ"
  },
  "9": {
    "nameEn": "Munshiganj",
    "nameBn": "মুন্সিগঞ্জ"
  },
  "10": {
    "nameEn": "Mymensingh",
    "nameBn": "ময়মনসিংহ"
  },
  "11": {
    "nameEn": "Narayanganj",
    "nameBn": "নারায়াণগঞ্জ"
  },
  "12": {
    "nameEn": "Narsingdi",
    "nameBn": "নরসিংদী"
  },
  "13": {
    "nameEn": "Netrokona",
    "nameBn": "নেত্রকোণা"
  },
  "14": {
    "nameEn": "Rajbari",
    "nameBn": "রাজবাড়ি"
  },
  "15": {
    "nameEn": "Shariatpur",
    "nameBn": "শরীয়তপুর"
  },
  "16": {
    "nameEn": "Sherpur",
    "nameBn": "শেরপুর"
  },
  "17": {
    "nameEn": "Tangail",
    "nameBn": "টাঙ্গাইল"
  },
  "18": {
    "nameEn": "Bogura",
    "nameBn": "বগুড়া"
  },
  "19": {
    "nameEn": "Joypurhat",
    "nameBn": "জয়পুরহাট"
  },
  "20": {
    "nameEn": "Naogaon",
    "nameBn": "নওগাঁ"
  },
  "21": {
    "nameEn": "Natore",
    "nameBn": "নাটোর"
  },
  "22": {
    "nameEn": "Nawabganj",
    "nameBn": "নবাবগঞ্জ"
  },
  "23": {
    "nameEn": "Pabna",
    "nameBn": "পাবনা"
  },
  "24": {
    "nameEn": "Rajshahi",
    "nameBn": "রাজশাহী"
  },
  "25": {
    "nameEn": "Sirajganj",
    "nameBn": "সিরাজগঞ্জ"
  },
  "26": {
    "nameEn": "Dinajpur",
    "nameBn": "দিনাজপুর"
  },
  "27": {
    "nameEn": "Gaibandha",
    "nameBn": "গাইবান্ধা"
  },
  "28": {
    "nameEn": "Kurigram",
    "nameBn": "কুড়িগ্রাম"
  },
  "29": {
    "nameEn": "Lalmonirhat",
    "nameBn": "লালমনিরহাট"
  },
  "30": {
    "nameEn": "Nilphamari",
    "nameBn": "নীলফামারী"
  },
  "31": {
    "nameEn": "Panchagarh",
    "nameBn": "পঞ্চগড়"
  },
  "32": {
    "nameEn": "Rangpur",
    "nameBn": "রংপুর"
  },
  "33": {
    "nameEn": "Thakurgaon",
    "nameBn": "ঠাকুরগাঁও"
  },
  "34": {
    "nameEn": "Barguna",
    "nameBn": "বরগুনা"
  },
  "35": {
    "nameEn": "Barishal",
    "nameBn": "বরিশাল"
  },
  "36": {
    "nameEn": "Bhola",
    "nameBn": "ভোলা"
  },
  "37": {
    "nameEn": "Jhalokati",
    "nameBn": "ঝালকাঠি"
  },
  "38": {
    "nameEn": "Patuakhali",
    "nameBn": "পটুয়াখালী"
  },
  "39": {
    "nameEn": "Pirojpur",
    "nameBn": "পিরোজপুর"
  },
  "40": {
    "nameEn": "Bandarban",
    "nameBn": "বান্দরবান"
  },
  "41": {
    "nameEn": "Brahmanbaria",
    "nameBn": "ব্রাহ্মণবাড়িয়া"
  },
  "42": {
    "nameEn": "Chandpur",
    "nameBn": "চাঁদপুর"
  },
  "43": {
    "nameEn": "Chattogram",
    "nameBn": "চট্টগ্রাম"
  },
  "44": {
    "nameEn": "Cumilla",
    "nameBn": "কুমিল্লা"
  },
  "45": {
    "nameEn": "Cox's Bazar",
    "nameBn": "কক্স বাজার"
  },
  "46": {
    "nameEn": "Feni",
    "nameBn": "ফেনী"
  },
  "47": {
    "nameEn": "Khagrachari",
    "nameBn": "খাগড়াছড়ি"
  },
  "48": {
    "nameEn": "Lakshmipur",
    "nameBn": "লক্ষ্মীপুর"
  },
  "49": {
    "nameEn": "Noakhali",
    "nameBn": "নোয়াখালী"
  },
  "50": {
    "nameEn": "Rangamati",
    "nameBn": "রাঙ্গামাটি"
  },
  "51": {
    "nameEn": "Habiganj",
    "nameBn": "হবিগঞ্জ"
  },
  "52": {
    "nameEn": "Maulvibazar",
    "nameBn": "মৌলভীবাজার"
  },
  "53": {
    "nameEn": "Sunamganj",
    "nameBn": "সুনামগঞ্জ"
  },
  "54": {
    "nameEn": "Sylhet",
    "nameBn": "সিলেট"
  },
  "55": {
    "nameEn": "Bagerhat",
    "nameBn": "বাগেরহাট"
  },
  "56": {
    "nameEn": "Chuadanga",
    "nameBn": "চুয়াডাঙ্গা"
  },
  "57": {
    "nameEn": "Jashore",
    "nameBn": "যশোর"
  },
  "58": {
    "nameEn": "Jhenaidah",
    "nameBn": "ঝিনাইদহ"
  },
  "59": {
    "nameEn": "Khulna",
    "nameBn": "খুলনা"
  },
  "60": {
    "nameEn": "Kushtia",
    "nameBn": "কুষ্টিয়া"
  },
  "61": {
    "nameEn": "Magura",
    "nameBn": "মাগুরা"
  },
  "62": {
    "nameEn": "Meherpur",
    "nameBn": "মেহেরপুর"
  },
  "63": {
    "nameEn": "Narail",
    "nameBn": "নড়াইল"
  },
  "64": {
    "nameEn": "Satkhira",
    "nameBn": "সাতক্ষীরা"
  }
};

export const DISTRICT_ADJACENCY = {
  "1": [
    "2",
    "3",
    "8",
    "9",
    "11",
    "17"
  ],
  "2": [
    "1",
    "4",
    "7",
    "8",
    "9",
    "14",
    "61",
    "63"
  ],
  "3": [
    "1",
    "10",
    "11",
    "12",
    "17"
  ],
  "4": [
    "2",
    "7",
    "35",
    "39",
    "55",
    "63"
  ],
  "5": [
    "10",
    "16",
    "17",
    "18",
    "25",
    "27",
    "28"
  ],
  "6": [
    "10",
    "12",
    "13",
    "41",
    "51",
    "53"
  ],
  "7": [
    "2",
    "4",
    "9",
    "15",
    "35"
  ],
  "8": [
    "1",
    "2",
    "14",
    "17",
    "23",
    "25"
  ],
  "9": [
    "1",
    "2",
    "7",
    "11",
    "15",
    "42",
    "44"
  ],
  "10": [
    "3",
    "5",
    "6",
    "13",
    "16",
    "17"
  ],
  "11": [
    "1",
    "3",
    "9",
    "12",
    "41",
    "44"
  ],
  "12": [
    "3",
    "6",
    "11",
    "41"
  ],
  "13": [
    "6",
    "10",
    "53"
  ],
  "14": [
    "2",
    "8",
    "23",
    "58",
    "60",
    "61"
  ],
  "15": [
    "7",
    "9",
    "35",
    "42"
  ],
  "16": [
    "5",
    "10"
  ],
  "17": [
    "1",
    "3",
    "5",
    "8",
    "10",
    "25"
  ],
  "18": [
    "5",
    "19",
    "20",
    "21",
    "25",
    "27"
  ],
  "19": [
    "18",
    "20",
    "26",
    "27"
  ],
  "20": [
    "18",
    "19",
    "21",
    "22",
    "24"
  ],
  "21": [
    "18",
    "20",
    "23",
    "24",
    "25",
    "60"
  ],
  "22": [
    "20",
    "24"
  ],
  "23": [
    "8",
    "14",
    "21",
    "25",
    "60"
  ],
  "24": [
    "20",
    "21",
    "22",
    "60"
  ],
  "25": [
    "5",
    "8",
    "17",
    "18",
    "21",
    "23"
  ],
  "26": [
    "19",
    "27",
    "30",
    "31",
    "32",
    "33"
  ],
  "27": [
    "5",
    "18",
    "19",
    "26",
    "28",
    "32"
  ],
  "28": [
    "5",
    "27",
    "29",
    "32"
  ],
  "29": [
    "28",
    "30",
    "32"
  ],
  "30": [
    "26",
    "29",
    "31",
    "32"
  ],
  "31": [
    "26",
    "30",
    "33"
  ],
  "32": [
    "26",
    "27",
    "28",
    "29",
    "30"
  ],
  "33": [
    "26",
    "31"
  ],
  "34": [
    "35",
    "37",
    "38",
    "39",
    "55"
  ],
  "35": [
    "4",
    "7",
    "15",
    "34",
    "36",
    "37",
    "38",
    "39",
    "42",
    "48"
  ],
  "36": [
    "35",
    "38",
    "48",
    "49"
  ],
  "37": [
    "34",
    "35",
    "39"
  ],
  "38": [
    "34",
    "35",
    "36"
  ],
  "39": [
    "4",
    "34",
    "35",
    "37",
    "55"
  ],
  "40": [
    "43",
    "45",
    "50"
  ],
  "41": [
    "6",
    "11",
    "12",
    "44",
    "51"
  ],
  "42": [
    "9",
    "15",
    "35",
    "44",
    "48",
    "49"
  ],
  "43": [
    "40",
    "45",
    "46",
    "47",
    "49",
    "50"
  ],
  "44": [
    "9",
    "11",
    "41",
    "42",
    "46",
    "49"
  ],
  "45": [
    "40",
    "43"
  ],
  "46": [
    "43",
    "44",
    "49"
  ],
  "47": [
    "43",
    "50"
  ],
  "48": [
    "35",
    "36",
    "42",
    "49"
  ],
  "49": [
    "36",
    "42",
    "43",
    "44",
    "46",
    "48"
  ],
  "50": [
    "40",
    "43",
    "47"
  ],
  "51": [
    "6",
    "41",
    "52",
    "53",
    "54"
  ],
  "52": [
    "51",
    "54"
  ],
  "53": [
    "6",
    "13",
    "51",
    "54"
  ],
  "54": [
    "51",
    "52",
    "53"
  ],
  "55": [
    "4",
    "34",
    "39",
    "59",
    "63"
  ],
  "56": [
    "58",
    "60",
    "62"
  ],
  "57": [
    "58",
    "59",
    "61",
    "63",
    "64"
  ],
  "58": [
    "14",
    "56",
    "57",
    "60",
    "61"
  ],
  "59": [
    "55",
    "57",
    "63",
    "64"
  ],
  "60": [
    "14",
    "21",
    "23",
    "24",
    "56",
    "58",
    "62"
  ],
  "61": [
    "2",
    "14",
    "57",
    "58",
    "63"
  ],
  "62": [
    "56",
    "60"
  ],
  "63": [
    "2",
    "4",
    "55",
    "57",
    "59",
    "61"
  ],
  "64": [
    "57",
    "59"
  ]
};

/**
 * Returns neighbor district codes for a given district code.
 * @param {string|number} districtCode
 * @returns {string[]}
 */
export function getNeighbors(districtCode) {
  const code = String(districtCode);
  return DISTRICT_ADJACENCY[code] || [];
}

/**
 * Check if two districts share an administrative boundary.
 * @param {string|number} code1
 * @param {string|number} code2
 * @returns {boolean}
 */
export function isNeighbor(code1, code2) {
  const c1 = String(code1);
  const c2 = String(code2);
  const list = DISTRICT_ADJACENCY[c1];
  return Array.isArray(list) && list.includes(c2);
}

/**
 * Get localized name for a district code.
 * @param {string|number} districtCode
 * @param {'bn'|'en'} lang
 * @returns {string}
 */
export function getDistrictName(districtCode, lang = 'bn') {
  const code = String(districtCode);
  const info = DISTRICT_INFO[code];
  if (!info) return code;
  return lang === 'en' ? info.nameEn : info.nameBn;
}
