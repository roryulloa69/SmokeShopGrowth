import pandas as pd
import json

def analyze_leads(file_path):
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return f"Error reading CSV: {e}"

    # Filter for callable leads (must have a phone number)
    df['phone_clean'] = df['phone'].astype(str).str.replace(r'\D', '', regex=True)
    callable_df = df[df['phone_clean'].str.len() >= 10].copy()

    total_leads = len(df)
    total_callable = len(callable_df)

    # Problem Detection Logic (Matching vapi_call.js logic)
    def detect_problem(row):
        website = str(row.get('website', '')).strip()
        if not website or website.lower() == 'nan':
            return "No Website"
        
        # In the CSV, we check for other indicators if website exists
        # Since we don't have live HTTP status or mobile check here, 
        # we'll look at existing 'issues' or 'has_website' columns if they exist
        has_website = str(row.get('has_website', '')).lower()
        if has_website == 'false':
            return "No Website"
            
        # Check for speed or score issues if available
        score = row.get('score', 100)
        try:
            score = float(score)
            if score < 50:
                return "Poor Performance/Old Site"
        except:
            pass
            
        return "Website Upgrade Opportunity"

    callable_df['detected_problem'] = callable_df.apply(detect_problem, axis=1)
    
    summary = {
        "total_leads": total_leads,
        "total_callable": total_callable,
        "problem_categories": callable_df['detected_problem'].value_counts().to_dict(),
        "top_leads": callable_df[['business_name', 'phone', 'detected_problem']].head(10).to_dict(orient='records')
    }
    
    return summary

if __name__ == "__main__":
    result = analyze_leads('leads.csv')
    print(json.dumps(result, indent=2))
