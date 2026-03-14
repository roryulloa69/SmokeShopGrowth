"""
delivery_agent.py — Handles post-deployment delivery flow.
Sends welcome email and enrolls lead in upsell sequence.
"""

def trigger_delivery_flow(lead_data, deployed_url):
    """
    Trigger the post-deployment delivery flow:
    - Send welcome email with live URL
    - Enroll in upsell email sequence
    """
    import os
    import smtplib
    from email.message import EmailMessage
    
    email = lead_data.get('email', '')
    business_name = lead_data.get('business_name', 'Shop Owner')
    city = lead_data.get('city', '')
    sender_name = os.getenv('AGENT_NAME', 'Alex')
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    
    if not email:
        print("[delivery_agent] No email — skipping delivery flow.")
        return
    
    if not smtp_user or not smtp_pass:
        print("[delivery_agent] SMTP not configured — skipping welcome email.")
        return
    
    msg = EmailMessage()
    msg['Subject'] = f"🎉 Your website is live — {business_name}"
    msg['From'] = f"{sender_name} <{smtp_user}>"
    msg['To'] = email
    msg.set_content(
        f"Hi {business_name},\n\n"
        f"Your website is now live! Here's your link:\n{deployed_url}\n\n"
        f"— {sender_name}"
    )
    
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"[delivery_agent] Welcome email sent to {email}")
    except Exception as e:
        print(f"[delivery_agent] Failed to send welcome email: {e}")
