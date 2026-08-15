// High-performance Cloud Key-Value persistence for clean short links

const KV_BUCKET = 'snap_service_portal_v2_quotations';

export const cloudKV = {
  saveQuotation: async (quotation: any): Promise<boolean> => {
    try {
      if (!quotation) return false;
      const qNum = (quotation.quotationNumber || '').trim().toLowerCase();
      const qId = (quotation.id || '').trim().toLowerCase();
      const jsonStr = JSON.stringify(quotation);

      // Save to Cloud KV store by quotation number and ID
      const savePromises: Promise<any>[] = [];

      if (qNum) {
        savePromises.push(
          fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${KV_BUCKET}/${encodeURIComponent(qNum)}/${encodeURIComponent(jsonStr)}`, {
            method: 'POST',
          }).catch(() => {})
        );
      }

      if (qId && qId !== qNum) {
        savePromises.push(
          fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${KV_BUCKET}/${encodeURIComponent(qId)}/${encodeURIComponent(jsonStr)}`, {
            method: 'POST',
          }).catch(() => {})
        );
      }

      await Promise.all(savePromises);
      return true;
    } catch (e) {
      console.error('Cloud KV save error', e);
      return false;
    }
  },

  getQuotation: async (key: string): Promise<any | null> => {
    try {
      if (!key) return null;
      const cleanKey = key.trim().toLowerCase();
      const res = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${KV_BUCKET}/${encodeURIComponent(cleanKey)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const rawText = await res.text();
        if (rawText && rawText !== 'null' && rawText !== '""') {
          let parsedStr = rawText;
          try {
            parsedStr = JSON.parse(rawText);
          } catch (e) {}
          if (typeof parsedStr === 'string') {
            const quotation = JSON.parse(parsedStr);
            return quotation;
          } else if (typeof parsedStr === 'object') {
            return parsedStr;
          }
        }
      }
    } catch (e) {
      console.error('Cloud KV get error', e);
    }
    return null;
  },
};
