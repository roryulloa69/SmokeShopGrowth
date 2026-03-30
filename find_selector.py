
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to Google Maps...")
        try:
            await page.goto("https://www.google.com/maps/search/smoke+shop+in+Cypress", timeout=60000)
            await asyncio.sleep(10) # Wait for results
            
            # Print all H1s
            h1s = await page.query_selector_all("h1")
            print(f"Found {len(h1s)} H1 tags")
            for i, h1 in enumerate(h1s):
                text = await h1.inner_text()
                classes = await h1.get_attribute("class")
                print(f"H1 #{i}: text='{text}', classes='{classes}'")
            
            # Look for elements that look like business names in the list
            # Usually they are in a specific class
            results = await page.query_selector_all("div.qBF1Pd")
            print(f"Found {len(results)} elements with class 'qBF1Pd' (potential business names)")
            for i, res in enumerate(results[:5]):
                text = await res.inner_text()
                print(f"Result #{i}: '{text}'")
                
            if results:
                print("Clicking first result...")
                await results[0].click()
                await asyncio.sleep(5)
                
                # Check H1 again in detail panel
                h1s = await page.query_selector_all("h1")
                print(f"Found {len(h1s)} H1 tags after click")
                for i, h1 in enumerate(h1s):
                    text = await h1.inner_text()
                    classes = await h1.get_attribute("class")
                    print(f"Detail H1 #{i}: text='{text}', classes='{classes}'")
                    
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
