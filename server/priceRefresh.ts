import { PRICE_REFERENCES } from "@shared/priceGuide";
import type { PriceGuideInput, PriceGuideDraftPayload } from "./db";

const DUBIZZLE_URL = "https://www.dubizzle.com.eg/pets/birds-pigeons/";
const FORSWAP_URL = "https://4sw.app/category/7/69/birds-and-pigeons";
const MARKET_CONTEXT_URL = "https://www.youm7.com/story/2026/8/7/%D8%B3%D9%88%D9%82-%D8%A7%D9%84%D8%B3%D9%8A%D8%AF%D8%A9-%D8%B9%D8%A7%D8%A6%D8%B4%D8%A9-%D8%AC%D9%86%D8%A9-%D8%B7%D9%8A%D9%88%D8%B1-%D8%A7%D9%84%D8%B2%D9%8A%D9%86%D8%A9-%D9%81%D9%89-%D9%85%D8%B5%D8%B1/7504918";

type BirdRule = { id: string; names: RegExp };
const BIRD_RULES: BirdRule[] = [
  { id: "budgie", names: /بادجي|استرالي|استرالى/i },
  { id: "cockatiel", names: /كوكتيل/i },
  { id: "lovebird", names: /روز|فيشر/i },
  { id: "zebra", names: /زيبرا/i },
];
const MAX_REASONABLE_PRICE: Record<string, number> = { budgie: 3000, cockatiel: 10000, lovebird: 5000, zebra: 3000 };

function normalizeDigits(value: string) {
  return value.replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[٬،]/g, ",");
}

function parsePrices(html: string, today: string) {
  const text = normalizeDigits(html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " "));
  return PRICE_REFERENCES.map(base => {
    const rule = BIRD_RULES.find(item => item.id === base.id);
    if (!rule) return null;
    const values: number[] = [];
    const matches = text.matchAll(/(\d[\d,]*)\s*ج\.?م/g);
    let match = matches.next();
    while (!match.done) {
      const current = match.value;
      const start = Math.max(0, (current.index || 0) - 180);
      const end = Math.min(text.length, (current.index || 0) + current[0].length + 120);
      const numericValue = Number(current[1].replace(/,/g, ""));
      if (rule.names.test(text.slice(start, end)) && numericValue <= (MAX_REASONABLE_PRICE[base.id] || 100000)) values.push(numericValue);
      match = matches.next();
    }
    const usable = values.filter(value => Number.isFinite(value) && value > 0 && value < 100000);
    if (!usable.length) return null;
    const min = Math.min(...usable);
    const max = Math.max(...usable);
    return { ...base, range: `${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")} ج.م`, sourceAr: "دوبيزل مصر · تمت مراجعة For Swap للمقارنة · مرجع سوق السيدة عائشة", sourceEn: "Dubizzle Egypt · For Swap checked for comparison · Sayeda Aisha market context", sourceUrl: DUBIZZLE_URL, checkedOn: today, noteAr: `نطاق إعلانات عامة جُمِع آليًا يوم ${today}؛ يُراجع قبل الاعتماد. الأسعار الظاهرة من دوبيزل، وتم فحص For Swap كمصدر مقارنة. مرجع السوق: اليوم السابع`, noteEn: `Automatically collected public listing range on ${today}; review before approval. Visible prices are from Dubizzle; For Swap was checked as a comparison source. Market context: Youm7` } satisfies PriceGuideInput;
  }).filter((item): item is PriceGuideInput => Boolean(item));
}

export async function collectExternalPriceDraft(today: string): Promise<PriceGuideDraftPayload> {
  const headers = { accept: "text/html", "user-agent": "Bird-Lovers-price-review/1.0" };
  const [dubizzleResponse, forswapResponse] = await Promise.all([fetch(DUBIZZLE_URL, { headers }), fetch(FORSWAP_URL, { headers })]);
  if (!dubizzleResponse.ok && !forswapResponse.ok) throw new Error(`External price sources unavailable (${dubizzleResponse.status}/${forswapResponse.status})`);
  const html = `${dubizzleResponse.ok ? await dubizzleResponse.text() : ""} ${forswapResponse.ok ? await forswapResponse.text() : ""}`;
  const items = parsePrices(html, today);
  if (!items.length) throw new Error("No bird prices could be extracted from the public source");
  return { items, collectedOn: today, sourceUrl: DUBIZZLE_URL, sourceSummary: `تم فحص مصادر دوبيزل مصر وFor Swap وجمع ${items.length} أنواع من الأسعار الظاهرة في الإعلانات العامة. صفحة For Swap محفوظة للمقارنة، وقد لا تعرض أرقامًا في كل استجابة عامة. مرجع سوق السيدة عائشة من اليوم السابع: ${MARKET_CONTEXT_URL}. مصدر For Swap: ${FORSWAP_URL}` };
}
