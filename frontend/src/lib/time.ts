/**
 * Business hours and real-time open status evaluator
 */

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  statusBadgeColor: 'emerald' | 'amber' | 'zinc';
  detailNote?: string;
}

/**
 * Parse business hours string like "10:00 - 22:00" or "09:30 - 21:30"
 * and evaluate against current local client time.
 */
export function getBusinessStatus(businessHours?: string): BusinessStatus {
  if (!businessHours || !businessHours.includes('-')) {
    return {
      isOpen: true,
      statusText: '营业中',
      statusBadgeColor: 'emerald',
    };
  }

  try {
    const parts = businessHours.split('-').map((s) => s.trim());
    if (parts.length < 2) {
      return { isOpen: true, statusText: '营业中', statusBadgeColor: 'emerald' };
    }

    const [openStr, closeStr] = parts;
    const openParts = openStr.split(':').map(Number);
    const closeParts = closeStr.split(':').map(Number);

    if (openParts.length < 2 || closeParts.length < 2) {
      return { isOpen: true, statusText: '营业中', statusBadgeColor: 'emerald' };
    }

    const [openH, openM] = openParts;
    const [closeH, closeM] = closeParts;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    // Normal business hours (e.g. 10:00 - 22:00)
    if (closeMinutes > openMinutes) {
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        const remainingMinutes = closeMinutes - currentMinutes;
        if (remainingMinutes <= 45) {
          return {
            isOpen: true,
            statusText: '即将打烊',
            statusBadgeColor: 'amber',
            detailNote: `还剩 ${remainingMinutes} 分钟`,
          };
        }
        return {
          isOpen: true,
          statusText: '营业中',
          statusBadgeColor: 'emerald',
          detailNote: `${closeStr} 打烊`,
        };
      } else {
        return {
          isOpen: false,
          statusText: '已打烊',
          statusBadgeColor: 'zinc',
          detailNote: `明日 ${openStr} 营业`,
        };
      }
    }

    // Overnight business hours (e.g. 18:00 - 02:00)
    if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
      return {
        isOpen: true,
        statusText: '营业中',
        statusBadgeColor: 'emerald',
      };
    } else {
      return {
        isOpen: false,
        statusText: '已打烊',
        statusBadgeColor: 'zinc',
        detailNote: `${openStr} 营业`,
      };
    }
  } catch {
    return { isOpen: true, statusText: '营业中', statusBadgeColor: 'emerald' };
  }
}
