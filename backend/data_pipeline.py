import json
import csv
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Tuple
import re
import urllib.parse
from pymongo import MongoClient

class LeadAutomationEngine:
    def __init__(self):
        self.leads = []
        self.performance_metrics = {}
        self.at_risk_flags = []
        
        password = urllib.parse.quote_plus("Nikhil@1234")
        uri = f"mongodb+srv://Nikhil0628:{password}@cluster0.qgxgnru.mongodb.net/?appName=Cluster0"
        self.client = MongoClient(uri)
        self.db = self.client['eduflow_crm']
        self.leads_col = self.db['leads']
        self.reports_col = self.db['reports']

    def parse_whatsapp_export(self, messages: List[str]) -> List[Dict]:
        leads_extracted = defaultdict(lambda: {
            'messages': 0,
            'follow_ups': 0,
            'converted': False,
            'last_contact': None,
            'status': 'New'
        })
        
        for message in messages:
            match = re.match(r'\[(\d{2}:\d{2}), (\d{2}/\d{2}/\d{4})\] ([^:]+): (.+)', message)
            if match:
                time, date, contact, text = match.groups()
                
                leads_extracted[contact]['messages'] += 1
                leads_extracted[contact]['last_contact'] = f"{date} {time}"
                
                conversion_keywords = ['interested', 'confirm', 'yes', 'approved', 'enrolled']
                if any(keyword in text.lower() for keyword in conversion_keywords):
                    leads_extracted[contact]['converted'] = True
                    leads_extracted[contact]['status'] = 'Enrolled'
                elif leads_extracted[contact]['messages'] > 3:
                    leads_extracted[contact]['status'] = 'Interested'
        
        parsed_leads = []
        for contact, data in leads_extracted.items():
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', contact)
            email = email_match.group(0) if email_match else f"{contact.lower().replace(' ', '')}@example.com"
            
            parsed_leads.append({
                'name': contact,
                'email': email,
                'source': 'WhatsApp',
                'messages': data['messages'],
                'status': data['status'],
                'last_contact': data['last_contact'],
                'converted': data['converted'],
                'addedDate': datetime.now().strftime('%Y-%m-%d')
            })
        return parsed_leads

    def save_leads_to_db(self, leads: List[Dict]):
        for lead in leads:
            self.leads_col.update_one(
                {'name': lead['name']},
                {'$set': lead},
                upsert=True
            )

    def load_leads_from_db(self) -> List[Dict]:
        cursor = self.leads_col.find({}, {'_id': 0})
        return list(cursor)
    
    def flag_at_risk_leads(self, leads: List[Dict], days_inactive: int = 3) -> List[Dict]:
        at_risk = []
        for lead in leads:
            if lead.get('status') in ['New', 'Contacted']:
                at_risk.append({
                    'name': lead['name'],
                    'source': lead['source'],
                    'status': lead['status'],
                    'days_inactive': days_inactive,
                    'action': 'Send follow-up message',
                    'priority': 'HIGH' if lead['status'] == 'New' else 'MEDIUM'
                })
        return at_risk
    
    def generate_performance_report(self, leads: List[Dict]) -> Dict:
        total = len(leads)
        by_source = defaultdict(int)
        by_status = defaultdict(int)
        
        for lead in leads:
            by_source[lead.get('source', 'Unknown')] += 1
            by_status[lead.get('status', 'Unknown')] += 1
        
        enrolled = by_status.get('Enrolled', 0)
        interested = by_status.get('Interested', 0)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_leads': total,
            'by_source': dict(by_source),
            'by_status': dict(by_status),
            'enrollment_rate': round((enrolled / total * 100), 2) if total > 0 else 0,
            'conversion_rate': round(((interested + enrolled) / total * 100), 2) if total > 0 else 0,
            'at_risk_count': len(self.at_risk_flags),
            'insights': [
                f"💡 {by_source.get('Facebook', 0)} leads from Facebook Ads",
                f"💡 {by_source.get('Website', 0)} leads from Website", 
                f"💡 {by_source.get('WhatsApp', 0)} leads from WhatsApp Referrals",
                f"💡 Enrollment rate: {round((enrolled / total * 100), 1)}%" if total > 0 else "No leads logged yet",
                f"⚠️ {len(self.at_risk_flags)} leads flagged as at-risk" if self.at_risk_flags else "✅ All lead pipelines active"
            ]
        }
        
        self.reports_col.insert_one(report.copy())
        if '_id' in report:
            del report['_id']
        return report
    
    def export_to_csv(self, leads: List[Dict], filename: str = 'leads_report.csv') -> str:
        if not leads:
            return "No data to export"
        
        keys = leads[0].keys()
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(leads)
        
        return f"✅ Exported {len(leads)} leads to {filename}"
    
    def generate_json_report(self) -> Dict:
        return {
            'report_date': datetime.now().isoformat(),
            'performance': self.performance_metrics,
            'at_risk': self.at_risk_flags,
            'leads': self.leads,
            'actions': [
                "Re-engage 'New' leads within 24-hour SLA",
                "Execute follow-up for accounts with inactivity flags",
                "Update database records for converted candidates",
                "Assign re-engagement templates to 'Interested' segment"
            ]
        }


def run_pipeline():
    print("=" * 60)
    print("EduFlow AI PIPELINE EXECUTION (MONGODB CONNECTED)")
    print("=" * 60)
    print()
    
    engine = LeadAutomationEngine()
    
    whatsapp_messages = [
        "[09:30, 15/05/2026] Nikhil Sharma: Hi, interested in BTech CS from Chitkara",
        "[10:15, 15/05/2026] Priya Singh: When can I get the admission forms?",
        "[14:45, 16/05/2026] Nikhil Sharma: I confirm my enrollment",
        "[08:20, 17/05/2026] Arjun Gupta: What's the fee structure?",
        "[11:00, 17/05/2026] Priya Singh: Confirmed. When is the intake?",
        "[16:30, 18/05/2026] Arjun Gupta: Still waiting for fee details",
    ]
    
    print("📱 Parsing Raw WhatsApp Message Stream...")
    leads_from_whatsapp = engine.parse_whatsapp_export(whatsapp_messages)
    print(f"✅ Extracted {len(leads_from_whatsapp)} leads from WhatsApp logs")
    
    sample_leads = leads_from_whatsapp + [
        {'name': 'Rahul Verma', 'email': 'rahul@example.com', 'source': 'Website', 'status': 'New', 'messages': 0, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
        {'name': 'Zara Khan', 'email': 'zara@example.com', 'source': 'Facebook', 'status': 'Contacted', 'messages': 2, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
        {'name': 'Vikram Singh', 'email': 'vikram@example.com', 'source': 'Facebook', 'status': 'New', 'messages': 0, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
    ]
    
    print("💾 Saving parsed leads to MongoDB database...")
    engine.save_leads_to_db(sample_leads)
    
    print("📥 Loading all records from MongoDB...")
    db_leads = engine.load_leads_from_db()
    print(f"✅ Successfully loaded {len(db_leads)} records from database")
    
    engine.leads = db_leads
    engine.at_risk_flags = engine.flag_at_risk_leads(db_leads)
    engine.performance_metrics = engine.generate_performance_report(db_leads)
    
    print("📊 Daily Pipeline Status")
    print("-" * 60)
    report = engine.performance_metrics
    print(f"Timestamp: {report['timestamp'][:16]}")
    print(f"Active Leads: {report['total_leads']}")
    print(f"Attribution Breakdown: {report['by_source']}")
    print(f"Funnel Distribution: {report['by_status']}")
    print(f"Enrollment Conversion: {report['enrollment_rate']}%")
    print(f"Overall Interest Rate: {report['conversion_rate']}%")
    print()
    print("Operational Insights:")
    for insight in report['insights']:
        print(f"  {insight}")
    print()
    
    if engine.at_risk_flags:
        print("⚠️ Flagged High-Priority Exceptions")
        print("-" * 60)
        for flag in engine.at_risk_flags:
            print(f"  • {flag['name']} ({flag['source']})")
            print(f"    Reason: {flag['status']} | Inactive: {flag['days_inactive']} days")
            print(f"    Resolution: {flag['action']} | Priority: {flag['priority']}")
        print()
    
    print("📤 Writing Output JSON Report")
    print("-" * 60)
    json_report = engine.generate_json_report()
    
    output_file = 'lead_report.json'
    with open(output_file, 'w') as f:
        json.dump(json_report, f, indent=2)
    print(f"✅ Operations report successfully saved to: {output_file}")
    print("=" * 60)


if __name__ == '__main__':
    run_pipeline()
