import json
import csv
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Tuple
import re
import urllib.parse
from pymongo import MongoClient
import certifi
from ml_model import LeadConversionPredictor

class LeadAutomationEngine:
    def __init__(self):
        self.leads = []
        self.performance_metrics = {}
        self.at_risk_flags = []
        
        # Initialise ML predictor first (trains on seed data immediately)
        print("🤖 Initialising ML Conversion Predictor...")
        self.predictor = LeadConversionPredictor()

        password = urllib.parse.quote_plus("Nikhil@1234")
        uri = f"mongodb+srv://Nikhil0628:{password}@cluster0.qgxgnru.mongodb.net/?appName=Cluster0"
        try:
            self.client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
            self.db = self.client['eduflow_crm']
            self.leads_col = self.db['leads']
            self.reports_col = self.db['reports']
            self.client.admin.command('ping')
            self.use_db = True
            print("✅ Successfully connected to MongoDB Atlas")
        except Exception as e:
            print(f"⚠️ MongoDB connection failed: {e}. Falling back to local file storage mode.")
            self.use_db = False

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
        if self.use_db:
            try:
                for lead in leads:
                    self.leads_col.update_one(
                        {'name': lead['name']},
                        {'$set': lead},
                        upsert=True
                    )
                return
            except Exception as e:
                print(f"⚠️ Failed to save leads to MongoDB: {e}")
        
        print("💾 Saving leads locally (offline fallback mode)")
        current_leads = self.load_leads_from_db()
        leads_dict = {l['name']: l for l in current_leads}
        for lead in leads:
            leads_dict[lead['name']] = lead
        updated_leads = list(leads_dict.values())
        
        try:
            with open('lead_report.json', 'r') as f:
                data = json.load(f)
        except Exception:
            data = {}
        data['leads'] = updated_leads
        with open('lead_report.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        # Retrain model with the enriched dataset
        self.predictor.auto_train(extra_leads=updated_leads)

    def load_leads_from_db(self) -> List[Dict]:
        raw_leads = []
        if self.use_db:
            try:
                cursor = self.leads_col.find({}, {'_id': 0})
                raw_leads = list(cursor)
            except Exception as e:
                print(f"⚠️ Failed to load leads from MongoDB: {e}")
        
        if not raw_leads:
            # Fallback to local report if it exists
            try:
                import os
                if os.path.exists('lead_report.json'):
                    with open('lead_report.json', 'r') as f:
                        data = json.load(f)
                        raw_leads = data.get('leads', [])
            except Exception as e:
                print(f"⚠️ Failed to load offline fallback data: {e}")
        
        # Attach ML propensity score to every lead
        for lead in raw_leads:
            lead['ml_score'] = self.predictor.predict_propensity(lead)
            lead['ml_risk'] = lead['ml_score'] < 35 and lead.get('status') != 'Enrolled'
        
        return raw_leads
    
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
        
        # Compute average ML propensity across all active leads
        active_leads = [l for l in leads if l.get('status') != 'Enrolled']
        avg_propensity = round(
            sum(l.get('ml_score', 50) for l in active_leads) / len(active_leads)
        ) if active_leads else 0
        
        # ML-generated dynamic insights
        ml_insights = self.predictor.get_insights(leads)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_leads': total,
            'by_source': dict(by_source),
            'by_status': dict(by_status),
            'enrollment_rate': round((enrolled / total * 100), 2) if total > 0 else 0,
            'conversion_rate': round(((interested + enrolled) / total * 100), 2) if total > 0 else 0,
            'at_risk_count': len(self.at_risk_flags),
            'avg_propensity': avg_propensity,
            'model_accuracy': round(self.predictor.accuracy * 100, 1),
            'feature_importances': self.predictor.feature_importances,
            'ml_insights': ml_insights,
            'insights': ml_insights  # legacy key kept for compatibility
        }
        
        if self.use_db:
            try:
                self.reports_col.insert_one(report.copy())
            except Exception as e:
                print(f"⚠️ Failed to save report to MongoDB: {e}")
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
