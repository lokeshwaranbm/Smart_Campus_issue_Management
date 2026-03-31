import { useEffect, useMemo, useState } from 'react';
import { getDefaultSettings, getSettings } from '../utils/settings';

const DEFAULT_CAMPUS_INFO = getDefaultSettings().campusInfo;

export default function useCampusInfo() {
  const [campusInfo, setCampusInfo] = useState(DEFAULT_CAMPUS_INFO);

  useEffect(() => {
    let isMounted = true;

    const loadCampusInfo = async () => {
      const settings = await getSettings();
      if (!isMounted) return;

      setCampusInfo((prev) => ({
        ...prev,
        ...(settings?.campusInfo || {}),
      }));
    };

    loadCampusInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  const universityName = useMemo(() => {
    const value = (campusInfo?.universityName || '').trim();
    return value || DEFAULT_CAMPUS_INFO.universityName;
  }, [campusInfo]);

  const emailDomain = useMemo(() => {
    const contactEmail = (campusInfo?.contactEmail || '').trim();
    if (!contactEmail.includes('@')) return 'university.edu';
    return contactEmail.split('@')[1] || 'university.edu';
  }, [campusInfo]);

  return {
    campusInfo,
    universityName,
    emailDomain,
  };
}