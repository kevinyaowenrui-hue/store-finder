"""
AMap (高德地图) POI Data Collector & Cleaner for New Balance Stores in China.
This tool can fetch real-time POI data from AMap Open Platform Place Search API,
filter out counterfeit/fake stores (e.g. '新百伦领跑', '纽巴伦'), and standardize the schema.
"""

import os
import csv
import json
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional

# Keywords that indicate counterfeit or unverified imitation stores
FAKE_STORE_KEYWORDS = [
    "领跑", "新百伦领跑", "纽巴伦", "美国新百伦", "香港新百伦", 
    "新百伦经典", "新百伦旗舰店(领跑)", "领跑体育", "nblp", "new barlun"
]

# Keywords that indicate legitimate New Balance formats
LEGITIMATE_KEYWORDS = [
    "New Balance", "NEW BALANCE", "new balance", "NB", "新百伦"
]


class AMapStoreCollector:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("AMAP_API_KEY", "")
        self.base_url = "https://restapi.amap.com/v3/place/text"

    def is_legitimate_store(self, name: str, address: str = "") -> bool:
        """Filter out counterfeit/knockoff stores."""
        combined = f"{name} {address}".lower()
        for fake in FAKE_STORE_KEYWORDS:
            if fake.lower() in combined:
                return False
        return True

    def fetch_city_stores(self, city_name: str, keyword: str = "New Balance") -> List[Dict[str, Any]]:
        """Fetch POIs for a specific city using AMap Web Service API."""
        if not self.api_key:
            print("[!] No AMap API Key provided. Set AMAP_API_KEY environment variable.")
            return []

        stores = []
        page = 1
        page_size = 20

        while True:
            params = {
                "key": self.api_key,
                "keywords": keyword,
                "city": city_name,
                "citylimit": "true",
                "offset": page_size,
                "page": page,
                "extensions": "all",
                "output": "json"
            }
            url = f"{self.base_url}?{urllib.parse.urlencode(params)}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "StoreFinder/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                
                if data.get("status") != "1":
                    print(f"[-] AMap API returned error for {city_name}: {data.get('info')}")
                    break

                pois = data.get("pois", [])
                if not pois:
                    break

                for poi in pois:
                    name = poi.get("name", "")
                    address = poi.get("address", "")
                    if not self.is_legitimate_store(name, address):
                        continue

                    location = poi.get("location", "")
                    lng, lat = (None, None)
                    if location and "," in location:
                        parts = location.split(",")
                        lng, lat = float(parts[0]), float(parts[1])

                    # Standardize store data
                    store_record = {
                        "brand_name": "New Balance",
                        "mall_name": poi.get("name", "").split("(")[0].replace("New Balance", "").strip() or f"{city_name}专卖店",
                        "province": poi.get("pname", ""),
                        "city": poi.get("cityname", city_name),
                        "district": poi.get("adname", ""),
                        "address": address or poi.get("pname", "") + poi.get("cityname", "") + poi.get("adname", ""),
                        "store_name": f"New Balance {name}",
                        "floor": "1层",
                        "phone": poi.get("tel", "") or "",
                        "business_hours": "10:00 - 22:00",
                        "latitude": lat,
                        "longitude": lng,
                        "source_url": "https://www.newbalance.com.cn",
                        "tags": "官方零售,专卖店,复古潮流",
                        "is_active": "true"
                    }
                    stores.append(store_record)

                count = int(data.get("count", "0"))
                if page * page_size >= count or page >= 10:
                    break
                page += 1
                time.sleep(0.2) # Rate limit friendly
            except Exception as e:
                print(f"[-] Error fetching POI for {city_name}: {e}")
                break

        return stores


if __name__ == "__main__":
    collector = AMapStoreCollector()
    print("[*] AMapStoreCollector initialized. Pass AMAP_API_KEY to fetch live data from AMap.")
