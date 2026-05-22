from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime
from data_pipeline import LeadAutomationEngine
from sheets_sync import GoogleSheetsSync
from apscheduler.schedulers.background import BackgroundScheduler
import re

app = Flask(__name__)
CORS(app)

engine = LeadAutomationEngine()
sheets_client = GoogleSheetsSync()

# Set up background scheduler for daily sync
scheduler = BackgroundScheduler()
def run_daily_sync():
    print("🔄 Running scheduled Google Sheets sync...")
    sheets_client.sync_data(engine)

scheduler.add_job(func=run_daily_sync, trigger="interval", hours=24)
scheduler.start()
# Force initial execution to load/save database state
try:
    print("🤖 Initializing Live Lead CRM Backend...")
    db_leads = engine.load_leads_from_db()
    if not db_leads:
        print("📥 Database empty. Loading sample WhatsApp stream...")
        whatsapp_messages = [
            "[09:30, 15/05/2026] Nikhil Sharma: Hi, interested in BTech CS from Chitkara",
            "[10:15, 15/05/2026] Priya Singh: When can I get the admission forms?",
            "[14:45, 16/05/2026] Nikhil Sharma: I confirm my enrollment",
            "[08:20, 17/05/2026] Arjun Gupta: What's the fee structure?",
            "[11:00, 17/05/2026] Priya Singh: Confirmed. When is the intake?",
            "[16:30, 18/05/2026] Arjun Gupta: Still waiting for fee details",
        ]
        parsed = engine.parse_whatsapp_export(whatsapp_messages)
        sample_leads = parsed + [
            {'name': 'Rahul Verma', 'email': 'rahul@example.com', 'source': 'Website', 'status': 'New', 'messages': 0, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
            {'name': 'Zara Khan', 'email': 'zara@example.com', 'source': 'Facebook', 'status': 'Contacted', 'messages': 2, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
            {'name': 'Vikram Singh', 'email': 'vikram@example.com', 'source': 'Facebook', 'status': 'New', 'messages': 0, 'converted': False, 'addedDate': datetime.now().strftime('%Y-%m-%d')},
        ]
        engine.save_leads_to_db(sample_leads)
        db_leads = engine.load_leads_from_db()
    
    engine.leads = db_leads
    engine.at_risk_flags = engine.flag_at_risk_leads(db_leads)
    engine.performance_metrics = engine.generate_performance_report(db_leads)
    
    # Save a fresh snapshot
    json_report = engine.generate_json_report()
    with open('lead_report.json', 'w') as f:
        json.dump(json_report, f, indent=2)
    print("✅ Initialization Complete. Report generated.")
except Exception as e:
    print(f"⚠️ Initialization Error: {e}")


def sync_report_snapshot():
    """Generates the local lead_report.json file after database edits to keep static files in sync."""
    try:
        db_leads = engine.load_leads_from_db()
        engine.leads = db_leads
        engine.at_risk_flags = engine.flag_at_risk_leads(db_leads)
        engine.performance_metrics = engine.generate_performance_report(db_leads)
        json_report = engine.generate_json_report()
        with open('lead_report.json', 'w') as f:
            json.dump(json_report, f, indent=2)
    except Exception as e:
        print(f"⚠️ Failed to sync snapshot: {e}")


@app.route('/api/leads', methods=['GET'])
def get_leads():
    try:
        leads_list = engine.load_leads_from_db()
        return jsonify({
            'status': 'success',
            'leads': leads_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/leads', methods=['POST'])
def add_lead():
    try:
        data = request.json
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({
                'status': 'error',
                'message': 'Name and Email are required fields'
            }), 400
            
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return jsonify({
                'status': 'error',
                'message': 'Invalid email format provided'
            }), 400
        
        lead_item = {
            'name': data['name'],
            'email': data['email'],
            'source': data.get('source', 'Website'),
            'status': data.get('status', 'New'),
            'messages': int(data.get('messages', 0)),
            'converted': data.get('converted', False) or data.get('status') == 'Enrolled',
            'addedDate': data.get('addedDate', datetime.now().strftime('%Y-%m-%d')),
            'days_inactive': int(data.get('days_inactive', 3 if data.get('status') == 'New' else 0))
        }

        # Save to database
        engine.save_leads_to_db([lead_item])
        sync_report_snapshot()
        
        return jsonify({
            'status': 'success',
            'lead': lead_item
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/leads/batch', methods=['POST'])
def add_leads_batch():
    try:
        data = request.json
        if not data or not isinstance(data, list):
            return jsonify({
                'status': 'error',
                'message': 'Expected a JSON list of lead objects'
            }), 400
        
        sanitized_leads = []
        for l in data:
            if 'name' not in l:
                continue
            sanitized_leads.append({
                'name': l['name'],
                'email': l.get('email', f"{l['name'].lower().replace(' ', '')}@example.com"),
                'source': l.get('source', 'WhatsApp'),
                'status': l.get('status', 'New'),
                'messages': int(l.get('messages', 1)),
                'converted': l.get('converted', False) or l.get('status') == 'Enrolled',
                'addedDate': l.get('addedDate', datetime.now().strftime('%Y-%m-%d')),
                'days_inactive': int(l.get('days_inactive', 3 if l.get('status') == 'New' else 0))
            })

        if sanitized_leads:
            engine.save_leads_to_db(sanitized_leads)
            sync_report_snapshot()

        return jsonify({
            'status': 'success',
            'imported_count': len(sanitized_leads)
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/leads/<string:name>/status', methods=['PUT'])
def update_lead_status(name):
    try:
        data = request.json
        if not data or 'status' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Funnel status is required'
            }), 400
        
        new_status = data['status']
        days_inactive = 3 if new_status == 'New' else 0

        # Update matching lead
        if engine.use_db:
            try:
                engine.leads_col.update_one(
                    {'name': name},
                    {'$set': {'status': new_status, 'days_inactive': days_inactive, 'converted': new_status == 'Enrolled'}}
                )
            except Exception as e:
                print(f"⚠️ Failed to update MongoDB: {e}")
        else:
            try:
                with open('lead_report.json', 'r') as f:
                    data = json.load(f)
                for l in data.get('leads', []):
                    if l['name'] == name:
                        l['status'] = new_status
                        l['days_inactive'] = days_inactive
                        l['converted'] = new_status == 'Enrolled'
                with open('lead_report.json', 'w') as f:
                    json.dump(data, f, indent=2)
            except Exception:
                pass
        
        sync_report_snapshot()
        
        return jsonify({
            'status': 'success',
            'name': name,
            'status': new_status
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/leads/<string:name>', methods=['DELETE'])
def delete_lead(name):
    try:
        if engine.use_db:
            try:
                engine.leads_col.delete_one({'name': name})
            except Exception as e:
                print(f"⚠️ Failed to delete from MongoDB: {e}")
        else:
            try:
                with open('lead_report.json', 'r') as f:
                    data = json.load(f)
                data['leads'] = [l for l in data.get('leads', []) if l['name'] != name]
                with open('lead_report.json', 'w') as f:
                    json.dump(data, f, indent=2)
            except Exception:
                pass
        
        sync_report_snapshot()
        
        return jsonify({
            'status': 'success',
            'deleted': name
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/insights', methods=['GET'])
def get_insights():
    try:
        leads_list = engine.load_leads_from_db()
        at_risk = engine.flag_at_risk_leads(leads_list)
        metrics = engine.generate_performance_report(leads_list)
        
        return jsonify({
            'status': 'success',
            'metrics': metrics,
            'at_risk': at_risk
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/sync-sheets', methods=['POST'])
def sync_sheets():
    try:
        success = sheets_client.sync_data(engine)
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Successfully synced data to Google Sheets'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to sync. Ensure credentials.json is configured correctly.'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    # Running Flask API on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
