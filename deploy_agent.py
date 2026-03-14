"""
deploy_agent.py — Stub module for site deployment.
In production, replace this with your actual Vercel/Netlify deployment logic.
"""

def deploy_shop_website(lead_data):
    """
    Deploy a personalized smoke shop website for the given lead.
    Returns the deployed URL, or None on failure.
    """
    import os
    import subprocess
    
    business_name = lead_data.get('business_name', 'Smoke Shop')
    city = lead_data.get('city', 'Houston')
    
    # Attempt to run the deploy script if it exists
    deploy_script = 'deployments/deploy.sh'
    if os.path.exists(deploy_script):
        try:
            result = subprocess.run(
                ['bash', deploy_script],
                capture_output=True, text=True, timeout=300,
                env={**os.environ, 
                     'SHOP_NAME': business_name,
                     'SHOP_CITY': city,
                     'SHOP_EMAIL': lead_data.get('email', '')}
            )
            if result.returncode == 0:
                # Parse URL from stdout
                for line in result.stdout.splitlines():
                    if line.startswith('https://'):
                        return line.strip()
        except Exception as e:
            print(f"[deploy_agent] Deploy script failed: {e}")
    
    # Fallback: return demo URL
    demo_base = os.getenv('DEMO_BASE_URL', 'https://smoke-shop-premium-demo.netlify.app')
    from urllib.parse import quote
    return f"{demo_base}/?shop={quote(business_name)}&city={quote(city)}&deployed=true"
