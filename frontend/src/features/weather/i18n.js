// F8 Seasonal disease and weather awareness: texts for this feature only.
// Every key must start with 'weather.' (checked by foundation.test.jsx).
// Strict constraint: ZERO chemical doses or pesticide names.

export default {
  bn: {
    // Existing keys
    'weather.title': 'আবহাওয়া ও রোগ সতর্কতা',
    'weather.setAreaPrompt': 'আবহাওয়া ও রোগ সতর্কতা দেখতে আপনার এলাকা নির্বাচন করুন',
    'weather.setAreaAction': 'এলাকা নির্বাচন করুন',
    'weather.favourablePrefix': 'অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন:',
    'weather.blastFavourable': 'ব্লাস্ট: অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন',
    'weather.sheathBlightFavourable': 'খোল পোড়া রোগ: অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন',
    'weather.blightFavourable': 'ব্যাকটেরিয়াজনিত পাতা পোড়া: অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন',
    'weather.howItWorks': 'কীভাবে কাজ করে (বামিস পিডিএফ)',
    'weather.offlineNotice': 'অফলাইন — সংরক্ষিত তথ্য',
    'weather.unavailable': 'আবহাওয়ার তথ্য পাওয়া যায়নি',
    'weather.attribution': 'Weather data by Open-Meteo.com (CC BY 4.0)',
    'weather.bamisBulletin': 'বামিস জেলা বুলেটিন',
    'weather.next3Days': 'পরবর্তী ৩ দিনের পূর্বাভাস',
    'weather.pageIntro': 'আগামী ৩ দিনে আপনার জেলার আবহাওয়া কিছু ধানের রোগের জন্য বামিস-এর উল্লেখ করা অনুকূল অবস্থার সাথে মেলে কি না, তা দেখায়। এটি জমি দেখার মনে করিয়ে দেওয়া, রোগ আসবেই এমন পূর্বাভাস নয়।',
    'weather.pageRulesNote': 'ব্লাস্ট, খোল পোড়া ও ব্যাকটেরিয়াজনিত পাতা পোড়ার জন্য নিয়ম আছে। টুংরো, বাদামী দাগ ও পাতার স্মাটের কোনো আবহাওয়া নিয়ম নেই।',

    // F8 v2 Location bar
    'weather.useMyLocation': 'আমার অবস্থান ব্যবহার করুন',
    'weather.locating': 'অবস্থান নির্ণয় হচ্ছে...',
    'weather.accuracy': 'নির্ভুলতা: ±{n} মিটার',
    'weather.approxLocation': 'আনুমানিক অবস্থান',
    'weather.searchPlaceholder': 'গ্রাম, উপজেলা বা জেলা খুঁজুন (যেমন: সাভার, গাজিপুর)...',
    'weather.searchAction': 'অনুসন্ধান',
    'weather.changeLocation': 'বদলান',
    'weather.noLocationsFound': 'কোনো এলাকা পাওয়া যায়নি',
    'weather.searching': 'অনুসন্ধান হচ্ছে...',
    'weather.geoDenied': 'অবস্থানের অনুমতি দেওয়া হয়নি। দয়া করে নিচের সার্চ বক্স থেকে আপনার এলাকা খুঁজুন বা প্রোফাইলে জেলা নির্ধারণ করুন।',
    'weather.geoUnavailable': 'আপনার ডিভাইসের অবস্থান নির্ণয় করা যায়নি।',
    'weather.geoTimeout': 'অবস্থান নির্ণয়ের সময় শেষ হয়েছে। আবার চেষ্টা করুন।',
    'weather.levelVillage': 'গ্রাম/পাড়া',
    'weather.levelUpazila': 'উপজেলা',
    'weather.levelDistrict': 'জেলা',
    'weather.levelArea': 'এলাকা',

    // F8 v2 Report header
    'weather.reportTitle': 'আবহাওয়া ও ধান ফসল পর্যবেক্ষণ',
    'weather.reportSubtitle': 'বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি) ও কৃষি সম্প্রসারণ অধিদপ্তর (ডিএই) কৃষি-আবহাওয়া নির্দেশিকা',
    'weather.dataSource': 'তথ্যসূত্র: ওপেন-মেটিও (ECMWF IFS / ICON Seamless) ও ডিএই বামিস',
    'weather.updated': 'হালনাগাদ',
    'weather.updatedJustNow': 'মাত্র হালনাগাদ করা হয়েছে',
    'weather.updatedMinAgo': '{n} মিনিট পূর্বে',
    'weather.updatedHourAgo': '{n} ঘণ্টা পূর্বে',
    'weather.liveBadge': 'লাইভ পূর্বাভাস',
    'weather.cachedBadge': 'সংরক্ষিত তথ্য',
    'weather.staleBadge': 'পুরোনো সংরক্ষিত তথ্য (অফলাইন)',
    'weather.refreshAction': 'রিফ্রেশ',
    'weather.refreshing': 'হালনাগাদ হচ্ছে...',

    // F8 v2 Now card
    'weather.nowTitle': 'বর্তমান আবহাওয়া',
    'weather.observedTag': 'পর্যবেক্ষণ',
    'weather.feelsLike': 'অনুভূত',
    'weather.humidity': 'আপেক্ষিক আর্দ্রতা',
    'weather.rainNow': 'বর্তমান বৃষ্টিপাত',
    'weather.wind': 'বাতাসের গতি ও দিক',
    'weather.cloudCover': 'মেঘের পরিমাণ',
    'weather.dataNotAvailable': 'তথ্য পাওয়া যায়নি',

    // F8 v2 Next 7 days
    'weather.next7DaysTitle': 'পরবর্তী ৭ দিনের পূর্বাভাস',
    'weather.forecastTag': 'পূর্বাভাস',
    'weather.rainProb': 'বৃষ্টির সম্ভাবনা',
    'weather.sunshine': 'সূর্যালোক',
    'weather.hours': 'ঘণ্টা',

    // F8 v2 Last 7 days
    'weather.past7DaysTitle': 'বিগত ৭ দিনের আবহাওয়া (পুনর্বিশ্লেষণ)',
    'weather.reanalysisTag': 'পুনর্বিশ্লেষণ (ERA5)',
    'weather.reanalysisNote': 'ইউরোপীয় আবহাওয়া সংস্থা ECMWF ERA5 বায়ুমণ্ডলীয় পুনর্বিশ্লেষণ মডেলের তথ্য। এটি স্থানীয় গ্রাউন্ড স্টেশনের সরাসরি পরিমাপ নয়, বরং আঞ্চলিক মডেল বিশ্লেষণ।',
    'weather.totalRain': 'মোট বৃষ্টিপাত',
    'weather.rainyDays': 'বৃষ্টিবহুল দিন (≥১ মিমি)',
    'weather.meanRh': 'গড় আর্দ্রতা',
    'weather.tempRange': 'তাপমাত্রার সীমা',
    'weather.days': 'দিন',

    // F8 v2 Season & crop context
    'weather.seasonContextTitle': 'মৌসুম ও ফসলের পর্যায়',
    'weather.currentSeason': 'বর্তমান মৌসুম',
    'weather.selectStage': 'আপনার ফসলের বর্তমান পর্যায় নির্বাচন করুন:',
    'weather.cropStage': 'ফসলের পর্যায়',
    'weather.stageSeedling': 'বীজতলা ও চারা',
    'weather.stageTillering': 'কুশি পর্যায়',
    'weather.stageBootingFlowering': 'থোড় ও ফুল',
    'weather.stageRipening': 'পাকা পর্যায়',

    // F8 v2 Disease weather concerns
    'weather.diseaseConcernsTitle': 'রোগের অনুকূল আবহাওয়া ও ঝুঁকি বিশ্লেষণ',
    'weather.diseaseDisclaimer': 'এটি কেবল আবহাওয়া পরিস্থিতি পর্যবেক্ষণ, কোনো চূড়ান্ত রোগ নির্ণয় নয়। জমিতে গিয়ে সরাসরি ধান গাছ পরীক্ষা করুন এবং সন্দেহ হলে অ্যাপের ক্যামেরা দিয়ে স্ক্যান করুন।',
    'weather.researchRuleTag': 'গবেষণাভিত্তিক নিয়ম',
    'weather.qualitativeAdvisory': 'বর্ণনামূলক সতর্কতা',
    'weather.statMax': 'সর্বোচ্চ',
    'weather.statMin': 'সর্বনিম্ন',
    'weather.statRh': 'আর্দ্রতা',
    'weather.statCloud': 'মেঘ',
    'weather.ruleMatched': 'অনুকূল আবহাওয়া শনাক্ত — জমি পর্যবেক্ষণ করুন',
    'weather.ruleNotMatched': 'অনুকূল আবহাওয়া নেই',
    'weather.noWeatherRule': 'কোনো নির্ধারিত আবহাওয়া নিয়ম নেই',
    'weather.ruleCriteria': 'নির্ধারিত শর্ত',
    'weather.forecastValues': 'পূর্বাভাস উপাত্ত',
    'weather.viewSourceQuote': 'উৎস উদ্ধৃতি ও গবেষণা সূত্র দেখুন',
    'weather.hideSourceQuote': 'উৎস উদ্ধৃতি লুকান',
    'weather.favourableDaysInNext7': 'আগামী ৭ দিনে {n} দিন অনুকূল অবস্থা হতে পারে',

    // F8 v2 What to do
    'weather.whatToDoTitle': 'করণীয় ও মাঠ পর্যবেক্ষণ পরামর্শ',
    'weather.actionNote': 'বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি) ও ডিএই নির্দেশিত সাধারণ প্রতিরোধমূলক ব্যবস্থা:',
    'weather.actionBlast': 'ব্লাস্টের অনুকূল আবহাওয়ায় (কুয়াশা ও রাতে ঠাণ্ডা) জমিতে ইউরিয়া সারের উপরিপ্রয়োগ সাময়িক বন্ধ রাখুন এবং জমিতে রসের অভাব হতে দেবেন না।',
    'weather.actionSheath': 'খোল পোড়া রোগ দেখা দিলে জমির জমা পানি নিষ্কাশন করে ২-৩ দিন জমি শুকাতে দিন এবং অতিরিক্ত ঘন কুশি থাকলে বাতাস চলাচলের ব্যবস্থা করুন।',
    'weather.actionInspect': 'সকাল ও বিকেলে নিয়মিত জমির বিভিন্ন কোণে ঘুরে পাতার দাগ ও রঙের পরিবর্তন লক্ষ্য করুন।',
    'weather.chemicalWarning': 'কোনো প্রকার রাসায়নিক কীটনাশক বা ছত্রাকনাশক ব্যবহারের পূর্বে আপনার উপসহকারী কৃষি কর্মকর্তা (SAAO)-এর পরামর্শ নিন অথবা বিনামূল্যে কৃষি কল সেন্টারে ১৬১২৩ নম্বরে কল করুন।',
    'weather.scanLeafAction': 'ধানের পাতা পরীক্ষা করুন (হোম)',

    // F8 v2 Sources & Attribution
    'weather.sourcesTitle': 'তথ্যসূত্র ও কৃতজ্ঞতা',
    'weather.openMeteoAttribution': 'আবহাওয়া উপাত্ত: Open-Meteo.com (CC BY 4.0)। আবহাওয়া মডেল: ECMWF IFS (ইউরোপ) ও DWD ICON (জার্মানি)।',
    'weather.osmAttribution': 'স্থান অনুসন্ধান: OpenStreetMap ও Nominatim (© OpenStreetMap contributors, ODbL 1.0)।',
    'weather.agriSources': 'কৃষি নির্দেশিকা: কৃষি সম্প্রসারণ অধিদপ্তর (BAMIS) ও বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি)।',

    // F8 v2 Limitations
    'weather.limitationsTitle': 'সীমাবদ্ধতা ও সতর্কতা',
    'weather.limitGrid': 'আবহাওয়ার গ্রিড পরিমাপ প্রায় ১১ কিলোমিটার এলাকা জুড়ে। ফসলের ঘন ক্যানোপি বা স্থানীয় ছায়ার কারণে মাঠের ক্ষুদ্র আবহাওয়ায় সামান্য পার্থক্য হতে পারে।',
    'weather.limitForecast': 'পূর্বাভাস ৩ দিনের পর প্রাকৃতিক বায়ুমণ্ডলীয় কারণে পরিবর্তিত হতে পারে। নিয়মিত অ্যাপের পূর্বাভাস হালনাগাদ দেখুন।',
    'weather.limitDistrictCal': 'রোগের অনুকূল শর্তসমূহ সিলেট ও ফরিদপুর জেলার ক্রপ ক্যালেন্ডার এবং ব্রি নির্দেশিকা থেকে গৃহীত।',

    // Weather Status Labels
    'weather.rhHigh': 'অতিরিক্ত আর্দ্র',
    'weather.rhNormal': 'স্বাভাবিক',
    'weather.cloudy': 'মেঘলা আকাশ',
    'weather.clear': 'পরিষ্কার আকাশ',
    'weather.raining': 'বৃষ্টি হচ্ছে',
    'weather.noRain': 'বৃষ্টি নেই',

    // Units
    'weather.unitC': '°সে',
    'weather.unitMm': 'মিমি',
    'weather.unitKmh': 'কিমি/ঘণ্টা',
    'weather.unitPercent': '%',
  },
  en: {
    // Existing keys
    'weather.title': 'Weather & Disease Awareness',
    'weather.setAreaPrompt': 'Set your area to see weather and seasonal disease awareness',
    'weather.setAreaAction': 'Set your area',
    'weather.favourablePrefix': 'Favourable conditions — check your field:',
    'weather.blastFavourable': 'Blast: favourable conditions — check your field',
    'weather.sheathBlightFavourable': 'Sheath blight: favourable conditions — check your field',
    'weather.blightFavourable': 'Bacterial leaf blight: favourable conditions — check your field',
    'weather.howItWorks': 'How this works (BAMIS PDF)',
    'weather.offlineNotice': 'Offline — cached forecast',
    'weather.unavailable': 'Weather unavailable',
    'weather.attribution': 'Weather data by Open-Meteo.com (CC BY 4.0)',
    'weather.bamisBulletin': 'BAMIS District Bulletin',
    'weather.next3Days': 'Next 3 days forecast',
    'weather.pageIntro': 'Shows whether the weather for the next 3 days in your district matches the conditions BAMIS lists as favourable for some rice diseases. It is a reminder to check your field, not a forecast that a disease will come.',
    'weather.pageRulesNote': 'Rules exist for blast, sheath blight and bacterial leaf blight. Tungro, brown spot and leaf smut have no weather rule.',

    // F8 v2 Location bar
    'weather.useMyLocation': 'Use my location',
    'weather.locating': 'Locating...',
    'weather.accuracy': 'Accuracy: ±{n} m',
    'weather.approxLocation': 'Approximate location',
    'weather.searchPlaceholder': 'Search village, upazila or district (e.g. Savar, Gazipur)...',
    'weather.searchAction': 'Search',
    'weather.changeLocation': 'Change',
    'weather.noLocationsFound': 'No locations found',
    'weather.searching': 'Searching...',
    'weather.geoDenied': 'Location permission denied. Please search for your area below or set your district in your profile.',
    'weather.geoUnavailable': 'Device location is unavailable.',
    'weather.geoTimeout': 'Location request timed out. Please try again.',
    'weather.levelVillage': 'Village',
    'weather.levelUpazila': 'Upazila',
    'weather.levelDistrict': 'District',
    'weather.levelArea': 'Area',

    // F8 v2 Report header
    'weather.reportTitle': 'Weather & Rice Crop Analysis',
    'weather.reportSubtitle': 'Agro-meteorological guidance from BRRI & DAE BAMIS',
    'weather.dataSource': 'Source: Open-Meteo (ECMWF IFS / ICON Seamless) & DAE BAMIS',
    'weather.updated': 'Updated',
    'weather.updatedJustNow': 'Updated just now',
    'weather.updatedMinAgo': '{n} min ago',
    'weather.updatedHourAgo': '{n} h ago',
    'weather.liveBadge': 'Live Forecast',
    'weather.cachedBadge': 'Cached',
    'weather.staleBadge': 'STALE - Cached (Offline)',
    'weather.refreshAction': 'Refresh',
    'weather.refreshing': 'Refreshing...',

    // F8 v2 Now card
    'weather.nowTitle': 'Current Weather',
    'weather.observedTag': 'OBSERVED',
    'weather.feelsLike': 'Feels like',
    'weather.humidity': 'Humidity',
    'weather.rainNow': 'Rain Now',
    'weather.wind': 'Wind Speed & Direction',
    'weather.cloudCover': 'Cloud Cover',
    'weather.dataNotAvailable': 'Data not available',

    // F8 v2 Next 7 days
    'weather.next7DaysTitle': 'Next 7 Days Forecast',
    'weather.forecastTag': 'FORECAST',
    'weather.rainProb': 'Rain prob.',
    'weather.sunshine': 'Sunshine',
    'weather.hours': 'hrs',

    // F8 v2 Last 7 days
    'weather.past7DaysTitle': 'Last 7 Days (Reanalysis)',
    'weather.reanalysisTag': 'REANALYSIS (ERA5)',
    'weather.reanalysisNote': 'Data from ECMWF ERA5 atmospheric reanalysis model. Note: this is a regional model reanalysis, not a ground station sensor reading.',
    'weather.totalRain': 'Total Rainfall',
    'weather.rainyDays': 'Rainy Days (≥1mm)',
    'weather.meanRh': 'Mean Humidity',
    'weather.tempRange': 'Temperature Range',
    'weather.days': 'days',

    // F8 v2 Season & crop context
    'weather.seasonContextTitle': 'Season & Crop Stage Context',
    'weather.currentSeason': 'Current Season',
    'weather.selectStage': 'Select your current crop stage:',
    'weather.cropStage': 'Crop Stage',
    'weather.stageSeedling': 'Seedbed & Seedling',
    'weather.stageTillering': 'Tillering',
    'weather.stageBootingFlowering': 'Booting & Flowering',
    'weather.stageRipening': 'Ripening',

    // F8 v2 Disease weather concerns
    'weather.diseaseConcernsTitle': 'Disease Weather Concerns & Rules',
    'weather.diseaseDisclaimer': 'This is an agro-meteorological awareness check, not a biological diagnosis. Inspect your field directly and scan suspicious leaves with the app.',
    'weather.researchRuleTag': 'RESEARCH RULE',
    'weather.qualitativeAdvisory': 'QUALITATIVE ADVISORY',
    'weather.statMax': 'Max',
    'weather.statMin': 'Min',
    'weather.statRh': 'RH',
    'weather.statCloud': 'Cloud',
    'weather.ruleMatched': 'Favourable conditions detected — inspect field',
    'weather.ruleNotMatched': 'Conditions not favourable',
    'weather.noWeatherRule': 'No validated weather rule',
    'weather.ruleCriteria': 'Rule Criteria',
    'weather.forecastValues': 'Forecast Readings',
    'weather.viewSourceQuote': 'View source quote and citation',
    'weather.hideSourceQuote': 'Hide source quote',
    'weather.favourableDaysInNext7': 'Favourable conditions on {n} of next 7 days',

    // F8 v2 What to do
    'weather.whatToDoTitle': 'Field Actions & Monitoring Advice',
    'weather.actionNote': 'Standard non-chemical preventive measures advised by BRRI & DAE:',
    'weather.actionBlast': 'During blast-favourable conditions (fog and cool nights), temporarily halt urea top-dressing and keep field soil moist.',
    'weather.actionSheath': 'For sheath blight, drain excess water for 2-3 days to let the soil breathe and ensure good canopy aeration.',
    'weather.actionInspect': 'Inspect leaves and stems across different corners of the field regularly in morning and evening.',
    'weather.chemicalWarning': 'Before applying any chemical pesticide or fungicide, consult your local Sub-Assistant Agriculture Officer (SAAO) or call the Krishi Call Centre at 16123 (toll-free).',
    'weather.scanLeafAction': 'Scan Rice Leaf (Home)',

    // F8 v2 Sources & Attribution
    'weather.sourcesTitle': 'Data Sources & Attribution',
    'weather.openMeteoAttribution': 'Weather data: Open-Meteo.com (CC BY 4.0). Models: ECMWF IFS (Europe) and DWD ICON (Germany).',
    'weather.osmAttribution': 'Geocoding: OpenStreetMap & Nominatim (© OpenStreetMap contributors, ODbL 1.0).',
    'weather.agriSources': 'Agronomical guidance: Department of Agricultural Extension (BAMIS) & Bangladesh Rice Research Institute (BRRI).',

    // F8 v2 Limitations
    'weather.limitationsTitle': 'Limitations & Uncertainty',
    'weather.limitGrid': 'Weather grid resolution covers ~11 km. Field microclimate under dense leaf canopy may vary slightly.',
    'weather.limitForecast': 'Forecasts beyond 3 days carry atmospheric uncertainty; check daily for fresh forecasts.',
    'weather.limitDistrictCal': 'Rules are based on DAE crop calendars and BRRI published research.',

    // Weather Status Labels
    'weather.rhHigh': 'High Humidity',
    'weather.rhNormal': 'Normal Humidity',
    'weather.cloudy': 'Cloudy',
    'weather.clear': 'Clear Sky',
    'weather.raining': 'Raining',
    'weather.noRain': 'No Rain',

    // Units
    'weather.unitC': '°C',
    'weather.unitMm': 'mm',
    'weather.unitKmh': 'km/h',
    'weather.unitPercent': '%',
  },
};
