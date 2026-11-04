/**
 * Bangladesh Administrative Hierarchy (Divisions, Districts, Upazilas)
 * Sourced from BBS (Bangladesh Bureau of Statistics) and OCHA COD-AB.
 * 100% Free, static, local-first.
 */

export const DIVISIONS = [
  { id: 'dhaka', name_bn: 'ঢাকা', name_en: 'Dhaka' },
  { id: 'chittagong', name_bn: 'চট্টগ্রাম', name_en: 'Chattogram' },
  { id: 'rajshahi', name_bn: 'রাজশাহী', name_en: 'Rajshahi' },
  { id: 'khulna', name_bn: 'খুলনা', name_en: 'Khulna' },
  { id: 'barisal', name_bn: 'বরিশাল', name_en: 'Barishal' },
  { id: 'sylhet', name_bn: 'সিলেট', name_en: 'Sylhet' },
  { id: 'rangpur', name_bn: 'রংপুর', name_en: 'Rangpur' },
  { id: 'mymensingh', name_bn: 'ময়মনসিংহ', name_en: 'Mymensingh' },
];

export const DISTRICT_TO_DIVISION = {
  // Dhaka Division
  '1': 'dhaka', // Dhaka
  '2': 'dhaka', // Faridpur
  '3': 'dhaka', // Gazipur
  '4': 'dhaka', // Gopalganj
  '7': 'dhaka', // Madaripur
  '8': 'dhaka', // Manikganj
  '9': 'dhaka', // Munshiganj
  '10': 'dhaka', // Narayanganj
  '11': 'dhaka', // Narsingdi
  '12': 'dhaka', // Rajbari
  '13': 'dhaka', // Shariatpur
  '14': 'dhaka', // Tangail
  '6': 'dhaka', // Kishoreganj

  // Mymensingh Division
  '5': 'mymensingh', // Jamalpur
  '30': 'mymensingh', // Mymensingh
  '31': 'mymensingh', // Netrokona
  '32': 'mymensingh', // Sherpur

  // Chattogram Division
  '43': 'chittagong', // Chattogram
  '44': 'chittagong', // Cox's Bazar
  '45': 'chittagong', // Cumilla
  '46': 'chittagong', // Brahmanbaria
  '47': 'chittagong', // Chandpur
  '48': 'chittagong', // Feni
  '49': 'chittagong', // Khagrachhari
  '50': 'chittagong', // Lakshmipur
  '51': 'chittagong', // Noakhali
  '52': 'chittagong', // Rangamati
  '53': 'chittagong', // Bandarban

  // Rajshahi Division
  '23': 'rajshahi', // Bogura
  '24': 'rajshahi', // Joypurhat
  '25': 'rajshahi', // Naogaon
  '26': 'rajshahi', // Natore
  '27': 'rajshahi', // Chapainawabganj
  '28': 'rajshahi', // Pabna
  '29': 'rajshahi', // Rajshahi
  '33': 'rajshahi', // Sirajganj

  // Khulna Division
  '15': 'khulna', // Bagerhat
  '16': 'khulna', // Chuadanga
  '17': 'khulna', // Jashore
  '18': 'khulna', // Jhenaidah
  '19': 'khulna', // Khulna
  '20': 'khulna', // Kushtia
  '21': 'khulna', // Magura
  '22': 'khulna', // Meherpur
  '34': 'khulna', // Narail
  '35': 'khulna', // Satkhira

  // Barishal Division
  '36': 'barisal', // Barguna
  '37': 'barisal', // Barishal
  '38': 'barisal', // Bhola
  '39': 'barisal', // Jhalokathi
  '40': 'barisal', // Patuakhali
  '41': 'barisal', // Pirojpur

  // Sylhet Division
  '54': 'sylhet', // Sylhet
  '55': 'sylhet', // Moulvibazar
  '56': 'sylhet', // Habiganj
  '57': 'sylhet', // Sunamganj

  // Rangpur Division
  '58': 'rangpur', // Dinajpur
  '59': 'rangpur', // Gaibandha
  '60': 'rangpur', // Kurigram
  '61': 'rangpur', // Lalmonirhat
  '62': 'rangpur', // Nilphamari
  '63': 'rangpur', // Panchagarh
  '64': 'rangpur', // Rangpur
  '42': 'rangpur', // Thakurgaon
};

// Major agricultural upazilas for key rice growing districts
export const UPAZILAS_BY_DISTRICT = {
  // Gazipur (3)
  '3': [
    { id: 'gazipur_sadar', name_bn: 'গাজীপুর সদর', name_en: 'Gazipur Sadar' },
    { id: 'kaliakair', name_bn: 'কালিয়াকৈর', name_en: 'Kaliakair' },
    { id: 'kaliganj', name_bn: 'কালীগঞ্জ', name_en: 'Kaliganj' },
    { id: 'kapasia', name_bn: 'কাপাসিয়া', name_en: 'Kapasia' },
    { id: 'sreepur', name_bn: 'শ্রীপুর', name_en: 'Sreepur' },
  ],
  // Mymensingh (30)
  '30': [
    { id: 'mymensingh_sadar', name_bn: 'ময়মনসিংহ সদর', name_en: 'Mymensingh Sadar' },
    { id: 'trishal', name_bn: 'ত্রিশাল', name_en: 'Trishal' },
    { id: 'muktagachha', name_bn: 'মুক্তাগাছা', name_en: 'Muktagachha' },
    { id: 'bhaluka', name_bn: 'ভালুকা', name_en: 'Bhaluka' },
    { id: 'phulpur', name_bn: 'ফুলপুর', name_en: 'Phulpur' },
    { id: 'gafargaon', name_bn: 'গফরগাঁও', name_en: 'Gafargaon' },
  ],
  // Bogura (23)
  '23': [
    { id: 'bogura_sadar', name_bn: 'বগুড়া সদর', name_en: 'Bogura Sadar' },
    { id: 'shibganj', name_bn: 'শিবগঞ্জ', name_en: 'Shibganj' },
    { id: 'sherpur', name_bn: 'শেরপুর', name_en: 'Sherpur' },
    { id: 'gabtali', name_bn: 'গাবতলী', name_en: 'Gabtali' },
    { id: 'kahaloo', name_bn: 'কাহালু', name_en: 'Kahaloo' },
  ],
  // Dinajpur (58)
  '58': [
    { id: 'dinajpur_sadar', name_bn: 'দিনাজপুর সদর', name_en: 'Dinajpur Sadar' },
    { id: 'birganj', name_bn: 'বীরগঞ্জ', name_en: 'Birganj' },
    { id: 'bochaganj', name_bn: 'বোচাগঞ্জ', name_en: 'Bochaganj' },
    { id: 'parbatipur', name_bn: 'পার্বতীপুর', name_en: 'Parbatipur' },
    { id: 'fulbari', name_bn: 'ফুলবাড়ী', name_en: 'Fulbari' },
  ],
  // Naogaon (25)
  '25': [
    { id: 'naogaon_sadar', name_bn: 'নওগাঁ সদর', name_en: 'Naogaon Sadar' },
    { id: 'patnitala', name_bn: 'পত্নীতলা', name_en: 'Patnitala' },
    { id: 'dhamoirhat', name_bn: 'ধামইরহাট', name_en: 'Dhamoirhat' },
    { id: 'mohadevpur', name_bn: 'মহাদেবপুর', name_en: 'Mohadevpur' },
    { id: 'manda', name_bn: 'মান্দা', name_en: 'Manda' },
  ],
};

/**
 * Returns list of upazilas for a district code.
 * If not in the pre-indexed list, provides standard Sadar and custom option.
 */
export function getUpazilasForDistrict(districtCode, districtNameBn, districtNameEn) {
  if (UPAZILAS_BY_DISTRICT[districtCode]) {
    return UPAZILAS_BY_DISTRICT[districtCode];
  }
  // Generic fallback: Sadar and other upazila
  return [
    {
      id: `${districtCode}_sadar`,
      name_bn: `${districtNameBn || ''} সদর`,
      name_en: `${districtNameEn || ''} Sadar`,
    },
    {
      id: `${districtCode}_other`,
      name_bn: 'অন্যান্য উপজেলা',
      name_en: 'Other Upazila',
    },
  ];
}

