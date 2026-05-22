import gspread
from google.oauth2.service_account import Credentials
import os
import json
from datetime import datetime

class GoogleSheetsSync:
    def __init__(self):
        self.credentials_file = 'credentials.json'
        self.sheet_name = 'EduFlow_Lead_Dashboard'  # Default sheet name
        self.client = None
        self.connect()

    def connect(self):
        try:
            if os.path.exists(self.credentials_file):
                scopes = [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ]
                credentials = Credentials.from_service_account_file(
                    self.credentials_file,
                    scopes=scopes
                )
                self.client = gspread.authorize(credentials)
                print("✅ Successfully connected to Google Sheets API")
            else:
                print(f"⚠️ Credentials file '{self.credentials_file}' not found. Sheets sync disabled.")
        except Exception as e:
            print(f"⚠️ Failed to connect to Google Sheets: {e}")

    def get_or_create_sheet(self):
        if not self.client:
            return None
            
        try:
            # Try to open the sheet by name
            sheet = self.client.open(self.sheet_name)
            return sheet
        except gspread.exceptions.SpreadsheetNotFound:
            try:
                # Create if it doesn't exist
                # Note: The service account will own this file. 
                # Users must share it with their own email.
                sheet = self.client.create(self.sheet_name)
                print(f"📄 Created new spreadsheet: {self.sheet_name}")
                return sheet
            except Exception as e:
                print(f"⚠️ Failed to create spreadsheet: {e}")
                return None
        except Exception as e:
            print(f"⚠️ Error accessing spreadsheet: {e}")
            return None

    def sync_data(self, engine):
        """Syncs MongoDB leads to Google Sheets"""
        if not self.client:
            print("⚠️ Sheets client not initialized. Skipping sync.")
            return False

        try:
            spreadsheet = self.get_or_create_sheet()
            if not spreadsheet:
                return False

            leads = engine.load_leads_from_db()
            metrics = engine.generate_performance_report(leads)

            self._sync_dashboard_tab(spreadsheet, metrics)
            self._sync_leads_tab(spreadsheet, leads)
            
            print(f"✅ Successfully synced {len(leads)} leads to Google Sheets at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True
            
        except Exception as e:
            print(f"⚠️ Failed to sync data to Google Sheets: {e}")
            return False

    def _sync_dashboard_tab(self, spreadsheet, metrics):
        try:
            worksheet = spreadsheet.worksheet("Dashboard")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Dashboard", rows="100", cols="20")
            
        # Prepare Dashboard Data
        last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        data = [
            ["EduFlow AI - Operational Dashboard"],
            ["Last Updated:", last_updated],
            [],
            ["KPI Metrics"],
            ["Total Leads:", metrics.get('total_leads', 0)],
            ["Enrollment Rate:", f"{metrics.get('enrollment_rate', 0)}%"],
            ["Conversion Rate:", f"{metrics.get('conversion_rate', 0)}%"],
            ["At Risk Leads:", metrics.get('at_risk_count', 0)],
            [],
            ["Leads by Source"]
        ]
        
        for source, count in metrics.get('by_source', {}).items():
            data.append([source, count])
            
        data.append([])
        data.append(["Leads by Status"])
        for status, count in metrics.get('by_status', {}).items():
            data.append([status, count])
            
        # Update sheet in one API call
        worksheet.clear()
        worksheet.update('A1', data)
        
        # Simple formatting
        worksheet.format('A1:B1', {'textFormat': {'bold': True, 'fontSize': 14}})
        worksheet.format('A4:B4', {'textFormat': {'bold': True, 'fontSize': 12}})

    def _sync_leads_tab(self, spreadsheet, leads):
        try:
            worksheet = spreadsheet.worksheet("Leads")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Leads", rows="1000", cols="20")
            
        if not leads:
            return

        # Prepare Headers
        headers = ['Name', 'Email', 'Source', 'Status', 'Messages', 'Converted', 'Days Inactive', 'Added Date']
        
        # Prepare Rows
        rows = [headers]
        for lead in leads:
            rows.append([
                lead.get('name', ''),
                lead.get('email', ''),
                lead.get('source', ''),
                lead.get('status', ''),
                lead.get('messages', 0),
                str(lead.get('converted', False)),
                lead.get('days_inactive', 0),
                lead.get('addedDate', '')
            ])
            
        worksheet.clear()
        worksheet.update('A1', rows)
        worksheet.format('A1:H1', {'textFormat': {'bold': True}, 'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9}})
