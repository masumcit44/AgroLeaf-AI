import enData from '../../../../disease_knowledge/disease_information_en.json';
import bnData from '../../../../disease_knowledge/disease_information_bn.json';

export function diseaseDisplayName(key, lang = 'bn') {
  const data = lang === 'en' ? enData : bnData;
  const cls = data?.classes?.[key];
  if (lang === 'en') return cls?.name_en || cls?.name || key;
  return cls?.name_bn || cls?.name || key;
}

export function isNotSureKey(key) {
  return key === 'not_sure' || key === null || key === undefined;
}
